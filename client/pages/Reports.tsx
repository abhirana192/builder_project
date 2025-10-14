import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Eye,
  File
} from "lucide-react";

interface Report {
  id: number;
  report_type: string;
  report_name: string;
  generated_by: string;
  created_at: string;
  status: string;
  file_path?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  parameters: string[];
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState<{from?: Date, to?: Date}>({});
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const reportTemplates: ReportTemplate[] = [
    {
      id: "booking_summary",
      name: "Booking Summary",
      description: "Overview of bookings, revenue, and guest statistics",
      category: "Financial",
      icon: BarChart3,
      parameters: ["date_range", "tour_package", "status"]
    },
    {
      id: "revenue_analysis",
      name: "Revenue Analysis",
      description: "Detailed revenue breakdown by tours, dates, and payment status",
      category: "Financial",
      icon: DollarSign,
      parameters: ["date_range", "payment_status"]
    },
    {
      id: "guest_demographics",
      name: "Guest Demographics",
      description: "Guest nationality, age groups, and preferences analysis",
      category: "Marketing",
      icon: Users,
      parameters: ["date_range", "nationality"]
    },
    {
      id: "tour_performance",
      name: "Tour Performance",
      description: "Tour popularity, capacity utilization, and guide performance",
      category: "Operations",
      icon: TrendingUp,
      parameters: ["date_range", "tour_package", "guide"]
    },
    {
      id: "vehicle_utilization",
      name: "Vehicle Utilization",
      description: "Vehicle usage, maintenance schedules, and efficiency metrics",
      category: "Operations",
      icon: MapPin,
      parameters: ["date_range", "vehicle_type"]
    },
    {
      id: "staff_performance",
      name: "Staff Performance",
      description: "Guide ratings, tour assignments, and staff productivity",
      category: "HR",
      icon: Users,
      parameters: ["date_range", "staff_role"]
    }
  ];

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Mock reports data
      setReports([
        {
          id: 1,
          report_type: "booking_summary",
          report_name: "March 2024 Booking Summary",
          generated_by: "Admin User",
          created_at: "2024-03-15T10:30:00",
          status: "completed",
          file_path: "/reports/march_2024_booking_summary.pdf"
        },
        {
          id: 2,
          report_type: "revenue_analysis",
          report_name: "Q1 2024 Revenue Analysis",
          generated_by: "Tour Manager",
          created_at: "2024-03-10T14:20:00",
          status: "completed",
          file_path: "/reports/q1_2024_revenue_analysis.xlsx"
        },
        {
          id: 3,
          report_type: "guest_demographics",
          report_name: "Guest Demographics - Winter Season",
          generated_by: "Admin User",
          created_at: "2024-03-05T09:15:00",
          status: "completed",
          file_path: "/reports/winter_2024_demographics.pdf"
        },
        {
          id: 4,
          report_type: "tour_performance",
          report_name: "February Tour Performance",
          generated_by: "Tour Manager",
          created_at: "2024-03-01T16:45:00",
          status: "generating"
        }
      ]);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'generating': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Financial': return 'default';
      case 'Operations': return 'secondary';
      case 'Marketing': return 'outline';
      case 'HR': return 'outline';
      default: return 'outline';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const generateReport = async (template: ReportTemplate) => {
    setIsGenerating(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: Report = {
        id: reports.length + 1,
        report_type: template.id,
        report_name: `${template.name} - ${new Date().toLocaleDateString()}`,
        generated_by: "Current User",
        created_at: new Date().toISOString(),
        status: "completed",
        file_path: `/reports/${template.id}_${Date.now()}.pdf`
      };
      
      setReports([newReport, ...reports]);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
      setSelectedTemplate(null);
    }
  };

  const filteredReports = reports.filter(report =>
    searchTerm === "" || 
    report.report_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.report_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.generated_by.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate comprehensive reports, analytics, and business insights
          </p>
        </div>
        <Button onClick={() => setSelectedTemplate(reportTemplates[0])}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{reports.length}</p>
                <p className="text-sm text-muted-foreground">Total Reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.status === 'generating').length}</p>
                <p className="text-sm text-muted-foreground">Generating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{reports.filter(r => r.file_path).length}</p>
                <p className="text-sm text-muted-foreground">Available Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Choose from predefined report templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <Card 
                  key={template.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-foreground">{template.name}</h3>
                          <Badge variant={getCategoryColor(template.category)} className="text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Reports</CardTitle>
          <CardDescription>Your recently generated reports and downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-foreground">{report.report_name}</h3>
                      <Badge variant={getStatusColor(report.status)}>{report.status}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Generated by {report.generated_by}</span>
                      <span>{formatDateTime(report.created_at)}</span>
                      <span className="capitalize">{report.report_type.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && report.file_path && (
                      <>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                        <Button size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </>
                    )}
                    {report.status === 'generating' && (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm text-muted-foreground">Generating...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? "Try adjusting your search criteria" 
                  : "Generate your first report to get started"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Generation Dialog */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Generate {selectedTemplate.name}</CardTitle>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDateRange?.from ? (
                        selectedDateRange.to ? (
                          <>
                            {selectedDateRange.from.toLocaleDateString()} - {selectedDateRange.to.toLocaleDateString()}
                          </>
                        ) : (
                          selectedDateRange.from.toLocaleDateString()
                        )
                      ) : (
                        "Pick a date range"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={selectedDateRange?.from}
                      selected={selectedDateRange}
                      onSelect={setSelectedDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">
                      <div className="flex items-center">
                        <File className="mr-2 h-4 w-4" />
                        PDF Document
                      </div>
                    </SelectItem>
                    <SelectItem value="excel">
                      <div className="flex items-center">
                        <File className="mr-2 h-4 w-4" />
                        Excel Spreadsheet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button 
                variant="outline" 
                onClick={() => setSelectedTemplate(null)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => generateReport(selectedTemplate)}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
