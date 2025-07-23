
"use client";

import type { Challenge } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mockChallenges: Challenge[] = [
    {
    id: '1',
    candidateName: 'Elena Rodriguez',
    candidateEmail: 'elena.r@example.com',
    jobTitle: 'Cloud Solutions Architect',
    status: 'Reviewed',
    createdAt: new Date('2023-10-26T10:00:00Z'),
    challengeDescription: 'Design and diagram a scalable, serverless architecture for a new social media analytics platform on AWS. Include services for data ingestion, processing, storage, and API endpoints.',
    requiredSkills: 'AWS,Serverless,Lambda,API Gateway,DynamoDB',
    setupInstructions: 'Use a diagramming tool like diagrams.net or Lucidchart. Provide a detailed README explaining your design choices.',
  },
  {
    id: '2',
    candidateName: 'Ben Carter',
    candidateEmail: 'ben.c@example.com',
    jobTitle: 'Senior Backend Engineer (Go)',
    status: 'Completed',
    createdAt: new Date('2023-10-25T14:30:00Z'),
    challengeDescription: 'Develop a high-performance caching service in Go. The service should support LRU eviction policy and expose a simple REST API for GET, SET, and DELETE operations.',
    requiredSkills: 'Go,REST API,Caching,LRU',
    setupInstructions: 'Create a new Go module. Use the standard library for the web server. No external database is needed.',
  },
  {
    id: '3',
    candidateName: 'Aisha Khan',
    candidateEmail: 'aisha.k@example.com',
    jobTitle: 'Lead DevOps Engineer',
    status: 'In Progress',
    createdAt: new Date('2023-10-27T09:00:00Z'),
    challengeDescription: 'Create a complete CI/CD pipeline for a simple microservices application (e.g., a Node.js API and a React frontend). The pipeline should include linting, testing, Docker image building, and deployment to a Kubernetes cluster.',
    requiredSkills: 'CI/CD,Jenkins,Docker,Kubernetes,Helm',
    setupInstructions: 'Provide a GitHub repository with the application code and all necessary configuration files (Jenkinsfile, Dockerfile, Helm charts).',
  },
  {
    id: '4',
    candidateName: 'Marcus Cole',
    candidateEmail: 'marcus.c@example.com',
    jobTitle: 'Data Scientist (NLP)',
    status: 'Pending',
    createdAt: new Date('2023-10-27T11:00:00Z'),
    challengeDescription: 'Build and train a sentiment analysis model on a provided dataset of customer reviews. Evaluate the model\'s performance and deploy it as a simple Flask API.',
    requiredSkills: 'Python,Pandas,Scikit-learn,NLP,Flask',
    setupInstructions: 'A Jupyter notebook should be used for exploration and model training. The final API should be in a separate Python script.',
  },
  {
    id: '5',
    candidateName: 'Sophia Loren',
    candidateEmail: 'sophia.l@example.com',
    jobTitle: 'Senior Frontend Developer',
    status: 'Completed',
    createdAt: new Date('2023-10-24T16:00:00Z'),
    challengeDescription: 'Replicate the functionality of a Trello-like board using React. Users should be able to create lists, add cards to lists, and drag-and-drop cards between lists.',
    requiredSkills: 'React,TypeScript,State Management,Drag & Drop API',
    setupInstructions: 'Use Create React App or Next.js. For state management, you can use Context API, Redux, or Zustand. Persist the board state to local storage.',
  },
];


const statusVariantMap: { [key in Challenge["status"]]: "default" | "secondary" | "outline" | "destructive" } = {
    Pending: "outline",
    "In Progress": "secondary",
    Completed: "default",
    Reviewed: "default",
};

export default function ChallengeList() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Challenges</CardTitle>
        <CardDescription>
          Manage and review all coding challenges sent to candidates.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead className="hidden md:table-cell">Job Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockChallenges.map((challenge) => (
              <TableRow key={challenge.id}>
                <TableCell>
                  <div className="font-medium">{challenge.candidateName}</div>
                  <div className="text-sm text-muted-foreground">{challenge.candidateEmail}</div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{challenge.jobTitle}</TableCell>
                <TableCell>
                  <Badge variant={statusVariantMap[challenge.status]}>{challenge.status}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {challenge.createdAt.toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Review Submission</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
