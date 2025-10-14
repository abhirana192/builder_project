import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, ArrowLeft, MapPin } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex min-h-[70vh] items-center justify-center">
        <Card className="mx-auto max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Page Not Found</CardTitle>
            <CardDescription className="text-lg">
              Looks like you've ventured off the beaten path
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
              Let's get you back on track.
            </p>
            <div className="space-y-2">
              <Link to="/dashboard">
                <Button className="w-full">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
