"use client";

import type { ChallengeResult } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ChallengeResultDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  result: ChallengeResult | null;
}

export function ChallengeResultDialog({
  isOpen,
  setIsOpen,
  result,
}: ChallengeResultDialogProps) {
  const { toast } = useToast();

  if (!result) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard!",
    });
  };

  const isCustomChallenge = "requiredSkills" in result;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">
            Challenge Generated Successfully!
          </DialogTitle>
          <DialogDescription>
            Review the details below. A repository will be created for the candidate.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Challenge Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {result.challengeDescription}
            </p>
          </div>
          
          {isCustomChallenge && 'requiredSkills' in result && (
            <div>
              <h3 className="font-semibold text-lg mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.requiredSkills.split(",").map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill.trim()}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-lg mb-2">Setup Instructions (for VSCode.dev)</h3>
            <div className="relative rounded-md bg-muted p-4">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => copyToClipboard(result.setupInstructions)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-code">
                <code>{result.setupInstructions}</code>
              </pre>
            </div>
          </div>
          
          {'expectedOutput' in result && (
             <div>
               <h3 className="font-semibold text-lg mb-2">Expected Output</h3>
               <div className="relative rounded-md bg-muted p-4">
                 <Button
                   variant="ghost"
                   size="icon"
                   className="absolute top-2 right-2 h-7 w-7"
                   onClick={() => copyToClipboard(result.expectedOutput)}
                 >
                   <Copy className="h-4 w-4" />
                 </Button>
                 <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-code">
                   <code>{result.expectedOutput}</code>
                 </pre>
               </div>
             </div>
           )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          <Button>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in VSCode.dev
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
