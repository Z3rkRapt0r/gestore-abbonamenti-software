import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Eye, 
  Search, 
  Loader2, 
  MoreVertical, 
  HardDrive, 
  Trash2
} from 'lucide-react';
import { useActiveEmployees } from '@/hooks/useActiveEmployees';
import CreateEmployeeForm from './CreateEmployeeForm';
import EditEmployeeForm from './EditEmployeeForm';
import UserStorageStatsDialog from './UserStorageStatsDialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export default function AdminEmployeesSection() {
  const { employees, loading, refreshEmployees } = useActiveEmployees();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [employeeToRemove, setEmployeeToRemove] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStorageStatsDialogOpen, setIsStorageStatsDialogOpen] = useState(false);
  
  const { toast } = useToast();

  const filteredEmployees = employees?.filter(employee =>
    `${employee.first_name || ''} ${employee.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleRemoveEmployee = async (employee: any) => {
    if (!employee) return;

    const confirmed = window.confirm(
      `Sei sicuro di voler rimuovere completamente ${employee.first_name} ${employee.last_name}? ` +
      `Questa azione eliminerà definitivamente tutti i dati del dipendente (documenti, presenze, ferie, notifiche) e non può essere annullata.`
    );

    if (!confirmed) return;

    setIsRemoving(true);
    setEmployeeToRemove(employee);

    try {
      const { data, error } = await supabase.functions.invoke('auto-cleanup-employee', {
        body: { 
          userId: employee.id, 
          userName: `${employee.first_name} ${employee.last_name}` 
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Errore durante la rimozione');
      }

      toast({
        title: "Dipendente rimosso",
        description: data.message,
        className: "bg-green-50 border-green-200 text-green-800",
      });

      // Refresh the employees list directly using the hook method
      refreshEmployees();
    } catch (error: any) {
      console.error('Error removing employee:', error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante la rimozione del dipendente",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
      setEmployeeToRemove(null);
    }
  };

  const handleCreateEmployeeSuccess = async () => {
    setIsCreateDialogOpen(false);
    refreshEmployees();
    toast({
      title: "Successo",
      description: "Dipendente aggiunto con successo",
      className: "bg-green-50 border-green-200 text-green-800",
    });
  };

  const handleEditEmployeeSuccess = async () => {
    setIsEditDialogOpen(false);
    setSelectedEmployee(null);
    refreshEmployees();
    toast({
      title: "Successo", 
      description: "Dipendente aggiornato con successo",
      className: "bg-blue-50 border-blue-200 text-blue-800",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg font-medium">Caricamento dipendenti...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestione Dipendenti</h1>
              <p className="text-slate-600 text-lg">
                Gestione completa dei dipendenti con rimozione automatica
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setIsStorageStatsDialogOpen(true)}
            className="border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            <HardDrive className="w-4 h-4 mr-2" />
            Statistiche Spazio
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <UserPlus className="w-5 h-5 mr-2" />
                Nuovo Dipendente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-slate-900">
                  Nuovo Dipendente
                </DialogTitle>
              </DialogHeader>
              <CreateEmployeeForm 
                onClose={() => setIsCreateDialogOpen(false)}
                onEmployeeCreated={handleCreateEmployeeSuccess}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 font-medium mb-1">Totale Dipendenti</p>
                <p className="text-3xl font-bold text-blue-800">{employees?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium mb-1">Dipendenti Attivi</p>
                <p className="text-3xl font-bold text-green-800">{employees?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 font-medium mb-1">Filtrati</p>
                <p className="text-3xl font-bold text-purple-800">{filteredEmployees?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
              <Users className="w-6 h-6 text-slate-600" />
              Lista Dipendenti
              <Badge variant="outline" className="bg-slate-100 border-slate-300 text-slate-700 font-medium">
                {employees?.length || 0} dipendenti
              </Badge>
            </CardTitle>
            
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cerca dipendente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {!filteredEmployees || filteredEmployees.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {searchTerm ? 'Nessun risultato trovato' : 'Nessun dipendente registrato'}
              </h3>
              <p className="text-slate-600">
                {searchTerm 
                  ? 'Prova con termini di ricerca diversi' 
                  : 'Aggiungi il primo dipendente per iniziare'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200/60">
                    <TableHead className="font-semibold text-slate-700">Nome Completo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Email</TableHead>
                    <TableHead className="font-semibold text-slate-700">Ruolo</TableHead>
                    <TableHead className="font-semibold text-slate-700">Stato</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee, index) => (
                    <TableRow 
                      key={employee.id} 
                      className="border-b border-slate-100/60 hover:bg-slate-50/80 transition-colors duration-200"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <span className="text-sm font-semibold text-slate-700">
                              {(employee.first_name?.[0] || '?').toUpperCase()}
                              {(employee.last_name?.[0] || '').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {employee.first_name && employee.last_name
                                ? `${employee.first_name} ${employee.last_name}`
                                : 'Nome non disponibile'
                              }
                            </p>
                            <p className="text-sm text-slate-500">{employee.employee_code || 'Codice non assegnato'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {employee.email || 'Email non disponibile'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'}>
                          {employee.role === 'admin' ? 'Amministratore' : 'Dipendente'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors duration-200">
                          Attivo
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEmployee(employee)}
                            className="border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/admin/documents/${employee.id}`, '_blank')}
                            className="border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-all duration-200"
                                disabled={isRemoving && employeeToRemove?.id === employee.id}
                              >
                                {isRemoving && employeeToRemove?.id === employee.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="w-4 h-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuItem 
                                onClick={() => handleRemoveEmployee(employee)}
                                className="text-red-600 focus:text-red-700 font-medium"
                                disabled={isRemoving}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Rimuovi Completamente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Modifica Dipendente
            </DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <EditEmployeeForm 
              employee={selectedEmployee}
              onClose={() => {
                setIsEditDialogOpen(false);
                setSelectedEmployee(null);
              }}
              onEmployeeUpdated={handleEditEmployeeSuccess}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Storage Stats Dialog */}
      <UserStorageStatsDialog
        isOpen={isStorageStatsDialogOpen}
        onClose={() => setIsStorageStatsDialogOpen(false)}
      />
    </div>
  );
}
