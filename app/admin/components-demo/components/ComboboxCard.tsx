/* eslint-disable no-unused-vars */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert, Combobox, type ComboboxOption } from "@/components/common";

interface ComboboxCardProps {
  frameworks: ComboboxOption[];
  comboboxValue: string;
  setComboboxValue: (value: string) => void;
}

export function ComboboxCard({ frameworks, comboboxValue, setComboboxValue }: ComboboxCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Combobox (Searchable Select)</CardTitle>
        <CardDescription>A powerful select component with search functionality</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select a framework</label>
          <Combobox
            options={frameworks}
            value={comboboxValue}
            onChange={setComboboxValue}
            placeholder="Select framework..."
            searchPlaceholder="Search frameworks..."
          />
        </div>
        {comboboxValue && (
          <Alert variant="success">
            You selected: <strong>{frameworks.find(f => f.value === comboboxValue)?.label}</strong>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

