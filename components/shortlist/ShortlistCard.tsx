"use client";

import { Draggable } from "@hello-pangea/dnd";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeadlineCountdown } from "./DeadlineCountdown";
import { MapPin, DollarSign, X, MessageSquare, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortlistCardProps {
  id: string;
  index: number;
  item: {
    university_name: string;
    program: string;
    country: string;
    tuition_usd: number;
    ranking: string;
    fit_score: number;
    application_deadline: string | null;
    notes: string;
  };
  onDelete: (id: string) => void;
}

export function ShortlistCard({ id, index, item, onDelete }: ShortlistCardProps) {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.6 : 1,
          }}
          className="mb-4"
        >
          <Card className="bg-[#111827] border-white/10 hover:border-primary/50 transition-all rounded-2xl overflow-hidden group shadow-xl">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                   <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm">{getFlag(item.country)}</span>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">
                        {item.university_name}
                      </h4>
                   </div>
                   <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest truncate">
                      {item.program}
                   </p>
                </div>
                <button 
                  onClick={() => onDelete(id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono">
                   <span className="text-muted-foreground border-b border-white/5 pb-1">FIT SCORE</span>
                   <span className="text-primary font-bold">{item.fit_score}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-primary" 
                      style={{ width: `${item.fit_score}%` }}
                   />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                 <DeadlineCountdown deadline={item.application_deadline} />
                 <div className="flex items-center justify-between">
                    <div className="flex items-center text-[10px] text-muted-foreground">
                       <DollarSign className="w-3 h-3 mr-1 text-emerald-500" />
                       ${(item.tuition_usd / 1000).toFixed(1)}k/yr
                    </div>
                    {item.notes && (
                       <Badge variant="secondary" className="bg-white/5 text-[8px] h-4">
                          <MessageSquare className="w-2 h-2 mr-1" /> NOTES
                       </Badge>
                    )}
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

function getFlag(country: string) {
  const flags: Record<string, string> = {
    'USA': '🇺🇸', 'UK': '🇬🇧', 'Canada': '🇨🇦', 'Germany': '🇩🇪', 'Australia': '🇦🇺', 'Singapore': '🇸🇬', 'India': '🇮🇳'
  };
  return flags[country] || '🌍';
}
