"use client";

import { useState } from "react";
import { requestOtp, verifyOtp } from "@/utils/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await requestOtp(phone);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la demande d'OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await verifyOtp(phone, otp);
      // Simuler l'enregistrement du token (localStorage, cookies, etc.)
      localStorage.setItem("accessToken", data.accessToken);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "OTP invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 text-white w-full">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-lg shadow-xl">
        <h1 className="text-2xl font-bold text-center">Portail Patient</h1>
        <p className="text-center text-slate-400">
          {step === "phone"
            ? "Connectez-vous avec votre numéro de téléphone (Passwordless)"
            : "Entrez le code OTP reçu par SMS ou WhatsApp"}
        </p>

        {error && (
          <div className="p-3 text-sm text-red-200 bg-red-900/50 border border-red-800 rounded">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Numéro de téléphone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+221770000000"
                className="w-full px-4 py-2 mt-1 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Envoi en cours..." : "Recevoir un code OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium">
                Code OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-2 mt-1 bg-slate-700 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-white"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Vérification..." : "Valider"}
            </button>
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="w-full px-4 py-2 text-sm text-slate-300 hover:text-white cursor-pointer"
            >
              Changer de numéro
            </button>
          </form>
        )}
      </div>
    </div>
  );
}