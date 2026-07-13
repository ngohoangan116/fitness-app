import { CheckIcon } from "@/components/Icons";

export default function CheckBox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <span
      className={`relative w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
        checked
          ? "bg-signal border-signal"
          : "border-steel/40 peer-hover:border-signal/70 peer-focus-visible:border-signal"
      }`}
    >
      <CheckIcon
        className={`w-4 h-4 text-chalk transition-all duration-150 ${checked ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
      />
    </span>
  );
}
