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
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`check-box ${checked ? "is-checked" : ""}`}
    >
      <CheckIcon />
    </span>
  );
}
