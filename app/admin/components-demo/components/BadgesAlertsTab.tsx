import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Alert,
} from "@/components/common";

export function BadgesAlertsTab() {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

