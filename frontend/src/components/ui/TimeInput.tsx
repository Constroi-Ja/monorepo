import { Input } from "@/components/ui/Input";
import { formatTimeInput } from "@/utils/formatters";

interface TimeInputProps {
  label: string;
  value: string;
  showRequired?: boolean;
  onChange: (value: string) => void;
}

export function TimeInput({ label, value, showRequired, onChange }: TimeInputProps) {
  return (
    <Input
      label={label}
      showRequired={showRequired}
      type="text"
      inputMode="numeric"
      maxLength={5}
      placeholder="00:00"
      value={formatTimeInput(value)}
      onChange={(event) => onChange(formatTimeInput(event.target.value))}
      aria-label={`${label} em formato 24 horas`}
    />
  );
}