import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useActiveEmployees } from '@/hooks/useActiveEmployees';
import { useOvertimeConflicts } from '@/hooks/useOvertimeConflicts';

const overtimeSchema = z.object({
  user_id: z.string().min(1, 'Seleziona un dipendente'),
  date: z.date({
    required_error: 'Seleziona una data',
  }),
  hours: z.number().int('Le ore devono essere un numero intero').min(1, 'Le ore devono essere almeno 1').max(24, 'Le ore non possono superare 24'),
  notes: z.string().optional(),
});

type OvertimeFormData = z.infer<typeof overtimeSchema>;

interface OvertimeEntryFormProps {
  onSuccess?: () => void;
}

export default function OvertimeEntryForm({ onSuccess }: OvertimeEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();
  const { employees } = useActiveEmployees();

  const form = useForm<OvertimeFormData>({
    resolver: zodResolver(overtimeSchema),
    defaultValues: {
      user_id: '',
      date: undefined,
      hours: 0,
      notes: '',
    },
  });

  const { conflictDates, isDateDisabled, isLoading: conflictsLoading } = useOvertimeConflicts(form.watch('user_id'));

  const onSubmit = async (data: OvertimeFormData) => {
    if (!profile?.id) {
      toast({
        title: "Errore",
        description: "Utente non autenticato",
        variant: "destructive",
      });
      return;
    }

    if (profile.role !== 'admin') {
      toast({
        title: "Errore",
        description: "Non hai i permessi per inserire straordinari",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('overtime_records')
        .insert({
          user_id: data.user_id,
          date: format(data.date, 'yyyy-MM-dd'),
          hours: data.hours,
          notes: data.notes || null,
          created_by: profile.id,
        });

      if (error) {
        console.error('Error creating overtime record:', error);
        toast({
          title: "Errore",
          description: "Errore nell'inserimento dello straordinario",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Successo",
        description: "Straordinario registrato con successo",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error in onSubmit:', error);
      toast({
        title: "Errore",
        description: "Errore nell'inserimento dello straordinario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Clock3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Non hai i permessi per inserire straordinari</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-orange-600" />
          Registra Straordinari
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dipendente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un dipendente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.first_name} {employee.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Seleziona una data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const employee = employees?.find(emp => emp.id === form.watch('user_id'));
                          const hireDate = employee?.hire_date ? new Date(employee.hire_date) : null;
                          return date > new Date() || 
                                 (hireDate && date < hireDate) ||
                                 isDateDisabled(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                  {conflictsLoading && (
                    <p className="text-sm text-orange-600 mt-1">
                      Controllo conflitti in corso...
                    </p>
                  )}
                  {form.watch('user_id') && !conflictsLoading && conflictDates.length > 0 && (
                    <p className="text-sm text-orange-600 mt-1">
                      ⚠️ {conflictDates.length} date disabilitate per conflitti con presenze, malattie, trasferte o ferie esistenti
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ore Straordinarie (numero intero)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      max="24"
                      placeholder="es. 3"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (opzionale)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrizione del lavoro straordinario..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {loading ? 'Registrazione...' : 'Registra Straordinario'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}