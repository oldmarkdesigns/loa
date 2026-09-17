import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function PresetTextField({
  value,
  onChange,
  presets,
  selectPlaceholder
}) {
  const selectedPreset = presets.includes(value) ? value : "";

  return (
    <Select value={selectedPreset} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={selectPlaceholder} />
      </SelectTrigger>
      <SelectContent>
        {presets.map((item) => (
          <SelectItem key={item} value={item}>{item}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default PresetTextField;
