import { parentPort, workerData } from 'worker_threads';
import * as brain from 'brain.js';
import { TrainingWorkerData, PredictionResult, DailyConsumption } from './inventory-predictor.interfaces';

// Helper: Moving Average for smoothing outliers
function smoothOutliers(data: DailyConsumption[], windowSize = 3): DailyConsumption[] {
  if (data.length === 0) return [];
  
  const smoothed: DailyConsumption[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    const sum = window.reduce((acc, curr) => acc + curr.quantity, 0);
    const avg = sum / window.length;
    
    smoothed.push({
      date: data[i].date,
      quantity: avg,
    });
  }
  return smoothed;
}

// Helper: Interpolation for missing days
function fillMissingDays(data: DailyConsumption[]): DailyConsumption[] {
  if (data.length <= 1) return data;
  
  const interpolated: DailyConsumption[] = [];
  interpolated.push(data[0]);

  for (let i = 1; i < data.length; i++) {
    const prevDate = new Date(data[i - 1].date);
    const currDate = new Date(data[i].date);
    
    // Add 1 day to prevDate
    const expectedNextDate = new Date(prevDate);
    expectedNextDate.setUTCDate(expectedNextDate.getUTCDate() + 1);

    while (expectedNextDate < currDate) {
      // Linear interpolation or simply hold previous value
      interpolated.push({
        date: expectedNextDate.toISOString().split('T')[0],
        quantity: data[i - 1].quantity, // Alternatively could interpolate strictly, but carrying forward is safer for inventory
      });
      expectedNextDate.setUTCDate(expectedNextDate.getUTCDate() + 1);
    }
    interpolated.push(data[i]);
  }
  return interpolated;
}

function preprocessData(data: DailyConsumption[]): number[] {
  // Sort by date just in case
  const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const filled = fillMissingDays(sorted);
  const smoothed = smoothOutliers(filled);
  
  return smoothed.map(d => d.quantity);
}

function run(): void {
  if (!parentPort) {
    throw new Error('This file must be run as a worker thread.');
  }

  try {
    const data = workerData as TrainingWorkerData;
    
    if (!data.consumptionHistory || data.consumptionHistory.length < 10) {
      throw new Error('Not enough historical data to train the model.');
    }

    const processedSeries = preprocessData(data.consumptionHistory);

    // Normalize data (LSTM performs better with values between 0 and 1)
    const maxVal = Math.max(...processedSeries);
    if (maxVal === 0) {
      return parentPort.postMessage({
        itemId: data.itemId,
        predictedConsumption30Days: 0,
        mse: 0,
        success: true,
      });
    }
    const normalizedSeries = processedSeries.map(val => val / maxVal);

    // Prepare training data for LSTMTimeStep
    // E.g., learning to predict next step based on a sequence
    // Due to seasonality, we can train it to predict the next value from a window of values.
    const trainingData = [];
    const stepSize = 7; // e.g., week seasonality
    for (let i = 0; i < normalizedSeries.length - stepSize; i++) {
      trainingData.push(normalizedSeries.slice(i, i + stepSize + 1)); // Next value is the label
    }

    if (trainingData.length === 0) {
       // Fallback directly
       trainingData.push(normalizedSeries);
    }

    // Initialize LSTM network
    const net = new brain.recurrent.LSTMTimeStep({
      inputSize: 1,
      hiddenLayers: [10],
      outputSize: 1,
    });

    const stats = net.train(trainingData, {
      iterations: 200,
      log: false,
      errorThresh: 0.011, // Standard threshold
    });

    // Predict the next 30 days
    let predictedTotal = 0;
    const currentWindow = normalizedSeries.slice(-stepSize);

    for (let i = 0; i < 30; i++) {
      const nextNormalized = net.run(currentWindow) as number;
      // Depending on brain.js typings and LSTMTimeStep, run() on a 1D array returns a number
      predictedTotal += (nextNormalized * maxVal);
      
      currentWindow.shift();
      currentWindow.push(nextNormalized);
    }

    const result: PredictionResult = {
      itemId: data.itemId,
      predictedConsumption30Days: predictedTotal,
      mse: stats.error,
      success: true,
    };

    parentPort.postMessage(result);
  } catch (error) {
    const err = error as Error;
    const result: PredictionResult = {
      itemId: workerData?.itemId || 'unknown',
      predictedConsumption30Days: 0,
      mse: 1,
      success: false,
      error: err.message,
    };
    parentPort.postMessage(result);
  }
}

run();
