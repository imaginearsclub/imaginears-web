"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Card,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  TooltipProvider,
} from "@/components/common";
import { BadgesAlertsTab } from "./components/BadgesAlertsTab";
import { InputsFormsTab } from "./components/InputsFormsTab";
import { FeedbackTab } from "./components/FeedbackTab";
import { OverlaysTab } from "./components/OverlaysTab";
import { AdvancedTab } from "./components/AdvancedTab";
import { getCommandItems, frameworks } from "./data";

function PageHeader() {
  return (
    <div className="text-center space-y-4 mb-12">
      <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
        Component Showcase
      </h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">
        A beautiful collection of accessible, production-ready components
      </p>
    </div>
  );
}

function PageFooter() {
  return (
    <Card className="mt-12">
      <CardContent className="pt-6">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Built with ❤️ using Radix UI and Tailwind CSS
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Badge variant="primary">TypeScript</Badge>
            <Badge variant="info">React</Badge>
            <Badge variant="success">Accessible</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ComponentsDemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(45);
  const [switchOn, setSwitchOn] = useState(false);
  const [selectedRadio, setSelectedRadio] = useState("option1");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comboboxValue, setComboboxValue] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  const commandItems = getCommandItems(router);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <PageHeader />

          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="w-full max-w-4xl mx-auto">
              <TabsTrigger value="badges">Badges & Alerts</TabsTrigger>
              <TabsTrigger value="inputs">Inputs & Forms</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="overlays">Overlays</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="badges">
              <BadgesAlertsTab />
            </TabsContent>

            <TabsContent value="inputs">
              <InputsFormsTab
                switchOn={switchOn}
                setSwitchOn={setSwitchOn}
                selectedRadio={selectedRadio}
                setSelectedRadio={setSelectedRadio}
              />
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackTab
                progress={progress}
                setProgress={setProgress}
                loading={loading}
                setLoading={setLoading}
              />
            </TabsContent>

            <TabsContent value="overlays">
              <OverlaysTab
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedTab
                commandItems={commandItems}
                frameworks={frameworks}
                comboboxValue={comboboxValue}
                setComboboxValue={setComboboxValue}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                dateRange={dateRange}
                setDateRange={setDateRange}
              />
            </TabsContent>
          </Tabs>

          <PageFooter />
        </div>
      </div>
    </TooltipProvider>
  );
}

