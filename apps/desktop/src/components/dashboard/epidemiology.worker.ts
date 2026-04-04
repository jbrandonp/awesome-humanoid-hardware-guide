export interface EpidemiologyRecord {
  id: string;
  date: string; // ISO string
  age: number;
  specialty: string;
  icd10: string;
}

export interface FilterCriteria {
  startDate: string | null;
  endDate: string | null;
  minAge: number | null;
  maxAge: number | null;
  specialty: string | null;
  icd10: string | null;
}

export interface ChartDataResult {
  timelineData: { date: string; cases: number }[];
  icd10Data: { name: string; value: number }[];
  specialtyData: { name: string; value: number }[];
  totalCases: number;
}

// Extracted processing function for testability
export const processEpidemiologyData = (
  records: EpidemiologyRecord[],
  filters: FilterCriteria,
): ChartDataResult => {
  // Pre-process date filters for optimization and correct day boundary inclusion using UTC to avoid timezone shift bugs
  let startDateFilter: Date | null = null;
  let endDateFilter: Date | null = null;

  if (filters.startDate) {
    startDateFilter = new Date(filters.startDate);
    startDateFilter.setUTCHours(0, 0, 0, 0);
  }
  if (filters.endDate) {
    endDateFilter = new Date(filters.endDate);
    endDateFilter.setUTCHours(23, 59, 59, 999);
  }

  // 1. Filter the data
  const filteredRecords = records.filter((record) => {
    let isValid = true;
    const recordDate = new Date(record.date);

    if (startDateFilter && recordDate < startDateFilter) isValid = false;
    if (endDateFilter && recordDate > endDateFilter) isValid = false;
    if (filters.minAge !== null && record.age < filters.minAge) isValid = false;
    if (filters.maxAge !== null && record.age > filters.maxAge) isValid = false;
    if (filters.specialty && record.specialty !== filters.specialty)
      isValid = false;
    if (filters.icd10 && !record.icd10.startsWith(filters.icd10))
      isValid = false; // Simple prefix match for ICD-10

    return isValid;
  });

  // 2. Aggregate the data for charts
  const timelineMap = new Map<string, number>();
  const icd10Map = new Map<string, number>();
  const specialtyMap = new Map<string, number>();

  filteredRecords.forEach((record) => {
    // Timeline aggregation (group by day)
    const dateKey = record.date.split('T')[0];
    timelineMap.set(dateKey, (timelineMap.get(dateKey) || 0) + 1);

    // ICD-10 aggregation
    icd10Map.set(record.icd10, (icd10Map.get(record.icd10) || 0) + 1);

    // Specialty aggregation
    specialtyMap.set(
      record.specialty,
      (specialtyMap.get(record.specialty) || 0) + 1,
    );
  });

  // 3. Format output
  const timelineData = Array.from(timelineMap.entries())
    .map(([date, cases]) => ({ date, cases }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Top 10 ICD-10 codes
  const icd10Data = Array.from(icd10Map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Top 10 Specialties
  const specialtyData = Array.from(specialtyMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return {
    timelineData,
    icd10Data,
    specialtyData,
    totalCases: filteredRecords.length,
  };
};

// Use typeof self !== 'undefined' to safely access self in both worker and node environments
if (typeof self !== 'undefined') {
  self.onmessage = (
    event: MessageEvent<{ records: EpidemiologyRecord[]; filters: FilterCriteria }>,
  ) => {
    const { records, filters } = event.data;
    const result = processEpidemiologyData(records, filters);
    self.postMessage(result);
  };
}
