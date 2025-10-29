/* eslint-disable no-unused-vars */
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Input,
  Checkbox,
  Switch,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/common";
import { Search } from "lucide-react";

interface InputsFormsTabProps {
  switchOn: boolean;
  setSwitchOn: (value: boolean) => void;
  selectedRadio: string;
  setSelectedRadio: (value: string) => void;
}

function InputFieldsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Input Fields</CardTitle>
        <CardDescription>Text inputs with validation states</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Default Input</label>
          <Input placeholder="Enter your name..." />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Success State</label>
          <Input placeholder="Valid input" state="success" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Error State</label>
          <Input placeholder="Invalid input" state="error" />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Search Input</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input className="pl-10" placeholder="Search..." />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FormControlsCardProps {
  switchOn: boolean;
  setSwitchOn: (value: boolean) => void;
  selectedRadio: string;
  setSelectedRadio: (value: string) => void;
}

function FormControlsCard({
  switchOn,
  setSwitchOn,
  selectedRadio,
  setSelectedRadio,
}: FormControlsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Controls</CardTitle>
        <CardDescription>Checkboxes, switches, and radio groups</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3">
          <Checkbox id="terms" />
          <label htmlFor="terms" className="text-sm font-medium">
            I accept the terms and conditions
          </label>
        </div>

        <div className="flex items-center justify-between">
          <label htmlFor="notifications" className="text-sm font-medium">
            Enable notifications
          </label>
          <Switch
            id="notifications"
            checked={switchOn}
            onCheckedChange={setSwitchOn}
          />
        </div>

        <Separator />

        <RadioGroup value={selectedRadio} onValueChange={setSelectedRadio}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="option1" />
            <label htmlFor="option1" className="text-sm">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="option2" />
            <label htmlFor="option2" className="text-sm">Option 2</label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option3" id="option3" />
            <label htmlFor="option3" className="text-sm">Option 3</label>
          </div>
        </RadioGroup>

        <Separator />

        <div>
          <label className="text-sm font-medium mb-2 block">Combobox (Better Select)</label>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            Use the Combobox component for a better select experience (see Advanced tab)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AccordionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accordion</CardTitle>
        <CardDescription>Collapsible content sections</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>What is Imaginears Club?</AccordionTrigger>
            <AccordionContent>
              Imaginears Club is a community platform for passionate creators and
              developers to collaborate on exciting projects.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How do I apply?</AccordionTrigger>
            <AccordionContent>
              Navigate to the application page and fill out the form with your
              details and why you want to join.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>What roles are available?</AccordionTrigger>
            <AccordionContent>
              We have Developer, Imaginear, and Guest Services roles, each with
              unique responsibilities and opportunities.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function InputsFormsTab({
  switchOn,
  setSwitchOn,
  selectedRadio,
  setSelectedRadio,
}: InputsFormsTabProps) {
  return (
    <div className="space-y-6">
      <InputFieldsCard />
      <FormControlsCard
        switchOn={switchOn}
        setSwitchOn={setSwitchOn}
        selectedRadio={selectedRadio}
        setSelectedRadio={setSelectedRadio}
      />
      <AccordionCard />
    </div>
  );
}

