import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tooltip,
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
} from "@/components/common";
import { Heart, Zap, Star, User, Settings, LogOut } from "lucide-react";

interface OverlaysTabProps {
  dialogOpen: boolean;
  setDialogOpen: (value: boolean) => void; // eslint-disable-line no-unused-vars
}

function TooltipCard() {
  return (
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
  );
}

function PopoverCard() {
  return (
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
  );
}

function DialogCard({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) { // eslint-disable-line no-unused-vars
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialog (Modal)</CardTitle>
        <CardDescription>Modal dialogs for important actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={onOpenChange}>
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
              <button className="btn btn-muted" onClick={() => onOpenChange(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => onOpenChange(false)}>
                Confirm
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function DropdownMenuCard() {
  return (
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
  );
}

export function OverlaysTab({ dialogOpen, setDialogOpen }: OverlaysTabProps) {
  return (
    <div className="space-y-6">
      <TooltipCard />
      <PopoverCard />
      <DialogCard open={dialogOpen} onOpenChange={setDialogOpen} />
      <DropdownMenuCard />
    </div>
  );
}

