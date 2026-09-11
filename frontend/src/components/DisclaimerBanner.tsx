import { AlertTriangle } from "lucide-react";

export default function DisclaimerBanner() {
  return (
    <div className="disclaimer-banner flex items-start gap-3">
      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-[var(--gold-disclaimer)]" />
      <p>
        <strong>CLINICAL &amp; REGULATORY DISCLAIMER:</strong> This application
        is an educational and research prototype decision-support tool. It is NOT
        a certified medical device and is NOT a substitute for professional
        medical diagnosis, radiological report, or physician consultation.
      </p>
    </div>
  );
}
