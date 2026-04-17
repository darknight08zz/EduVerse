"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShieldAlert } from "lucide-react";

interface ExternalLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  entityName: string;
}

export function ExternalLinkDialog({
  isOpen,
  onClose,
  url,
  entityName
}: ExternalLinkDialogProps) {
  const handleConfirm = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0f1e] border-white/10 sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center font-outfit text-white">Leaving EduVerse</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed">
            You are now leaving EduVerse to visit the official <strong>{entityName}</strong> portal. 
            EduVerse is not affiliated with this lender and does not guarantee loan approval.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[10px] text-muted-foreground font-mono leading-relaxed">
          <strong>Security Tip:</strong> Always verify that the portal URL matches the official lender domain before entering any sensitive financial information.
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={onClose} className="flex-1 text-muted-foreground hover:text-white">
            Stay on EduVerse
          </Button>
          <Button onClick={handleConfirm} className="flex-1 bg-primary text-background font-black uppercase tracking-widest text-xs">
            Proceed to Site <ExternalLink className="ml-2 w-3 h-3" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
