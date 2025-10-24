"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Alert,
  Input,
  Spinner,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Avatar,
  Progress,
  Skeleton,
  SkeletonText,
  EmptyState,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Switch,
  Checkbox,
  Select,
  Tooltip,
  TooltipProvider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  CommandPalette,
  Combobox,
  DatePicker,
  DateRangePicker,
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/common";
import type { CommandItem, ComboboxOption } from "@/components/common";
import {
  Bell,
  User,
  Search,
  Settings,
  LogOut,
  Zap,
  Heart,
  Star,
  FileText,
  Home,
  CalendarRange,
  Users,
  Copy,
  Edit,
  Trash2,
  Download,
} from "lucide-react";

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

  // Command Palette items
  const commandItems: CommandItem[] = [
    {
      id: "home",
      label: "Go to Dashboard",
      description: "Navigate to the main dashboard",
      icon: <Home className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => router.push("/admin/dashboard"),
    },
    {
      id: "events",
      label: "View Events",
      description: "Manage your events",
      icon: <CalendarRange className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => router.push("/admin/events"),
    },
    {
      id: "users",
      label: "View Players",
      description: "Manage player accounts",
      icon: <Users className="w-4 h-4" />,
      group: "Navigation",
      onSelect: () => router.push("/admin/players"),
    },
    {
      id: "settings",
      label: "Open Settings",
      description: "Configure your preferences",
      icon: <Settings className="w-4 h-4" />,
      shortcut: "⌘,",
      group: "Actions",
      onSelect: () => router.push("/admin/settings"),
    },
  ];

  // Combobox options
  const frameworks: ComboboxOption[] = [
    {
      value: "next",
      label: "Next.js",
      description: "The React Framework",
      icon: <Zap className="w-4 h-4 text-blue-600" />,
    },
    {
      value: "react",
      label: "React",
      description: "A JavaScript library for building UIs",
      icon: <Star className="w-4 h-4 text-cyan-600" />,
    },
    {
      value: "vue",
      label: "Vue",
      description: "The Progressive JavaScript Framework",
      icon: <Heart className="w-4 h-4 text-emerald-600" />,
    },
    {
      value: "svelte",
      label: "Svelte",
      description: "Cybernetically enhanced web apps",
      icon: <Zap className="w-4 h-4 text-orange-600" />,
    },
  ];

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Component Showcase
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              A beautiful collection of accessible, production-ready components
            </p>
          </div>

          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="w-full max-w-4xl mx-auto">
              <TabsTrigger value="badges">Badges & Alerts</TabsTrigger>
              <TabsTrigger value="inputs">Inputs & Forms</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="overlays">Overlays</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            {/* BADGES & ALERTS TAB */}
            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                  <CardDescription>Status indicators with 5 variants</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="danger">Danger</Badge>
                  <Badge variant="info">Info</Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerts</CardTitle>
                  <CardDescription>Contextual feedback messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert variant="info">
                    <strong>New feature!</strong> Check out our redesigned dashboard.
                  </Alert>
                  <Alert variant="success">
                    Your changes have been saved successfully.
                  </Alert>
                  <Alert variant="warning">
                    Your session will expire in 5 minutes.
                  </Alert>
                  <Alert variant="error" dismissible onDismiss={() => {}}>
                    <strong>Error:</strong> Unable to connect to server.
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* INPUTS & FORMS TAB */}
            <TabsContent value="inputs" className="space-y-6">
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
            </TabsContent>

            {/* FEEDBACK TAB */}
            <TabsContent value="feedback" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Progress Indicators</CardTitle>
                  <CardDescription>Visual progress feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Default Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} showValue />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Progress</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} variant="success" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Warning Progress</span>
                      <span>30%</span>
                    </div>
                    <Progress value={30} variant="warning" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Danger Progress</span>
                      <span>15%</span>
                    </div>
                    <Progress value={15} variant="danger" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-muted btn-sm"
                      onClick={() => setProgress((p) => Math.max(0, p - 10))}
                    >
                      Decrease
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setProgress((p) => Math.min(100, p + 10))}
                    >
                      Increase
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Spinners</CardTitle>
                  <CardDescription>Loading indicators in various sizes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-6">
                  <div className="text-center space-y-2">
                    <Spinner size="sm" />
                    <div className="text-xs text-slate-500">Small</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Spinner size="md" />
                    <div className="text-xs text-slate-500">Medium</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Spinner size="lg" />
                    <div className="text-xs text-slate-500">Large</div>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <button
                    className="btn btn-primary flex items-center gap-2"
                    disabled={loading}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(() => setLoading(false), 2000);
                    }}
                  >
                    {loading && <Spinner size="sm" variant="current" />}
                    {loading ? "Loading..." : "Click me"}
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                  <CardDescription>User profile pictures with fallbacks</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-6">
                  <div className="text-center space-y-2">
                    <Avatar
                      src="https://github.com/shadcn.png"
                      alt="User"
                      size="sm"
                    />
                    <div className="text-xs text-slate-500">Small</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar
                      src="https://github.com/shadcn.png"
                      alt="User"
                      size="md"
                    />
                    <div className="text-xs text-slate-500">Medium</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar
                      src="https://github.com/shadcn.png"
                      alt="User"
                      size="lg"
                    />
                    <div className="text-xs text-slate-500">Large</div>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <div className="text-center space-y-2">
                    <Avatar fallback="JD" size="md" />
                    <div className="text-xs text-slate-500">Fallback</div>
                  </div>
                  <div className="text-center space-y-2">
                    <Avatar fallback="??" size="md" />
                    <div className="text-xs text-slate-500">Default</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skeleton Loading</CardTitle>
                  <CardDescription>Placeholder content while loading</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                  <Separator />
                  <SkeletonText lines={3} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Empty State</CardTitle>
                  <CardDescription>Beautiful no-data displays</CardDescription>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={<FileText className="w-12 h-12" />}
                    title="No documents yet"
                    description="Get started by creating your first document."
                    action={
                      <button className="btn btn-primary">
                        Create Document
                      </button>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* OVERLAYS TAB */}
            <TabsContent value="overlays" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tooltips</CardTitle>
                  <CardDescription>Helpful hints on hover</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  <Tooltip content="This is a tooltip">
                    <button className="btn btn-muted">
                      <Heart className="w-4 h-4" />
                      Hover me
                    </button>
                  </Tooltip>
                  <Tooltip content="Quick actions available">
                    <button className="btn btn-primary">
                      <Zap className="w-4 h-4" />
                      Actions
                    </button>
                  </Tooltip>
                  <Tooltip content="Add to favorites">
                    <button className="btn btn-ghost">
                      <Star className="w-4 h-4" />
                    </button>
                  </Tooltip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popover</CardTitle>
                  <CardDescription>Floating content panels</CardDescription>
                </CardHeader>
                <CardContent>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="btn btn-primary">
                        Open Popover
                      </button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="space-y-3">
                        <h4 className="font-semibold">Popover Title</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          This is a popover with some helpful information. It can
                          contain any content you want!
                        </p>
                        <button className="btn btn-muted btn-sm w-full">
                          Got it
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dialog (Modal)</CardTitle>
                  <CardDescription>Modal dialogs for important actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <button className="btn btn-primary">
                        Open Dialog
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to proceed? This action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <button
                          className="btn btn-muted"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => setDialogOpen(false)}
                        >
                          Confirm
                        </button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dropdown Menu</CardTitle>
                  <CardDescription>Context menus with actions</CardDescription>
                </CardHeader>
                <CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="btn btn-primary">
                        <User className="w-4 h-4" />
                        Account Menu
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-rose-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ADVANCED TAB */}
            <TabsContent value="advanced" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Command Palette</CardTitle>
                  <CardDescription>
                    Keyboard-driven command menu (⌘K / Ctrl+K)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Press <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘K</kbd> or click the button below to open the command palette.
                  </p>
                  <CommandPalette items={commandItems} />
                  <Alert variant="info">
                    <strong>Pro tip:</strong> Use the keyboard shortcut ⌘K (Mac) or Ctrl+K (Windows) to quickly access navigation and actions.
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Combobox (Searchable Select)</CardTitle>
                  <CardDescription>
                    A powerful select component with search functionality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select a framework
                    </label>
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

              <Card>
                <CardHeader>
                  <CardTitle>Date Pickers</CardTitle>
                  <CardDescription>
                    Calendar-based date selection with single and range modes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Single Date Picker
                    </label>
                    <DatePicker
                      {...(selectedDate && { date: selectedDate })}
                      onDateChange={setSelectedDate}
                      placeholder="Pick a date"
                    />
                    {selectedDate && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Selected: {selectedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Date Range Picker
                    </label>
                    <DateRangePicker
                      from={dateRange.from}
                      to={dateRange.to}
                      onRangeChange={setDateRange}
                      placeholder="Pick a date range"
                    />
                    {(dateRange.from || dateRange.to) && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                        Range: {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString() || "..."}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Context Menu</CardTitle>
                  <CardDescription>
                    Right-click menu with contextual actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div className="flex items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
                        <div className="text-center space-y-2">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            Right-click here
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Try right-clicking to see the context menu
                          </p>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-64">
                      <ContextMenuLabel>Actions</ContextMenuLabel>
                      <ContextMenuSeparator />
                      <ContextMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </ContextMenuItem>
                      <ContextMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-rose-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </CardContent>
              </Card>

              <Alert variant="success">
                <strong>🎉 Advanced components ready!</strong> These powerful components bring modern UX patterns to your application.
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Footer */}
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
        </div>
      </div>
    </TooltipProvider>
  );
}

