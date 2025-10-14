import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export default function PlaceholderPage({ 
  title, 
  description, 
  icon: Icon = Construction 
}: PlaceholderPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
      
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="text-lg">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              This section is under development. Continue the conversation to have me build 
              out this page with the specific features you need.
            </p>
            <div className="space-y-2">
              <Link to="/dashboard">
                <Button className="w-full">
                  Return to Dashboard
                </Button>
              </Link>
              <Button variant="outline" className="w-full">
                Request Feature Development
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
