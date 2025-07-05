import type React from 'react';
import { useState, useEffect } from 'react';
import { useBackupStore } from '../stores/backupStore';
import { useUserStore } from '../stores/userStore';
import { type BackupType, type BackupFrequency, BACKUP_TYPE_LABELS, FREQUENCY_LABELS } from '../types/Backup';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import {
  Download,
  Upload,
  Plus,
  Settings,
  Trash2,
  Play,
  Pause,
  MoreHorizontal,
  Database,
  Clock,
  HardDrive,
  TrendingUp,
  Shield,
  RefreshCw
} from 'lucide-react';

const Backups: React.FC = () => {
  const {
    backups,
    configs,
    stats,
    isLoading,
    loadBackups,
    loadBackupConfigs,
    loadBackupStats,
    createBackup,
    deleteBackup,
    downloadBackup,
    restoreBackup,
    createBackupConfig,
    updateBackupConfig,
    deleteBackupConfig
  } = useBackupStore();

  const { hasPermission } = useUserStore();

  const [isCreateBackupOpen, setIsCreateBackupOpen] = useState(false);
  const [isCreateConfigOpen, setIsCreateConfigOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [newBackup, setNewBackup] = useState({
    type: 'full' as BackupType,
    description: '',
  });

  const [newConfig, setNewConfig] = useState({
    name: '',
    type: 'full' as BackupType,
    frequency: 'daily' as BackupFrequency,
    scheduleTime: '02:00',
    retentionDays: 30,
    isEnabled: true,
    includeFiles: true,
    compression: true,
    encryption: false,
  });

  useEffect(() => {
    if (hasPermission('canManageBackups')) {
      loadBackups();
      loadBackupConfigs();
      loadBackupStats();
    }
  }, [loadBackups, loadBackupConfigs, loadBackupStats, hasPermission]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleCreateBackup = async () => {
    if (!newBackup.type) {
      showAlert('error', 'Tipo de backup é obrigatório');
      return;
    }

    const result = await createBackup(newBackup.type, newBackup.description);
    if (result.success) {
      showAlert('success', 'Backup criado com sucesso');
      setIsCreateBackupOpen(false);
      setNewBackup({ type: 'full', description: '' });
    } else {
      showAlert('error', result.message || 'Erro ao criar backup');
    }
  };

  const handleCreateConfig = async () => {
    if (!newConfig.name || !newConfig.type) {
      showAlert('error', 'Nome e tipo são obrigatórios');
      return;
    }

    const result = await createBackupConfig(newConfig);
    if (result.success) {
      showAlert('success', 'Configuração criada com sucesso');
      setIsCreateConfigOpen(false);
      setNewConfig({
        name: '',
        type: 'full',
        frequency: 'daily',
        scheduleTime: '02:00',
        retentionDays: 30,
        isEnabled: true,
        includeFiles: true,
        compression: true,
        encryption: false,
      });
    } else {
      showAlert('error', result.message || 'Erro ao criar configuração');
    }
  };

  const handleDownloadBackup = async (id: string) => {
    const result = await downloadBackup(id);
    if (result.success) {
      showAlert('success', 'Download iniciado');
    } else {
      showAlert('error', result.message || 'Erro ao baixar backup');
    }
  };

  const handleDeleteBackup = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este backup?')) {
      const result = await deleteBackup(id);
      if (result.success) {
        showAlert('success', 'Backup excluído com sucesso');
      } else {
        showAlert('error', result.message || 'Erro ao excluir backup');
      }
    }
  };

  const handleRestoreBackup = async (id: string) => {
    if (window.confirm('Tem certeza que deseja restaurar este backup? Isso substituirá os dados atuais.')) {
      const result = await restoreBackup(id);
      if (result.success) {
        showAlert('success', 'Backup restaurado com sucesso');
      } else {
        showAlert('error', result.message || 'Erro ao restaurar backup');
      }
    }
  };

  const handleToggleConfig = async (configId: string, isEnabled: boolean) => {
    const result = await updateBackupConfig(configId, { isEnabled });
    if (result.success) {
      showAlert('success', `Configuração ${isEnabled ? 'ativada' : 'desativada'}`);
    } else {
      showAlert('error', result.message || 'Erro ao alterar configuração');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline',
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'outline'}>{status}</Badge>;
  };

  const filteredBackups = backups.filter(backup =>
    backup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    backup.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasPermission('canManageBackups')) {
    return (
      <div className="p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar o gerenciamento de backups.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Backups</h1>
          <p className="text-muted-foreground">
            Gerencie backups automáticos e restaurações do sistema
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog open={isCreateBackupOpen} onOpenChange={setIsCreateBackupOpen}>
            <DialogTrigger asChild>
              <Button>
                <Database className="mr-2 h-4 w-4" />
                Criar Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-type">Tipo de Backup</Label>
                  <Select
                    value={newBackup.type}
                    onValueChange={(value: BackupType) => setNewBackup({ ...newBackup, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BACKUP_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backup-description">Descrição (opcional)</Label>
                  <Input
                    id="backup-description"
                    value={newBackup.description}
                    onChange={(e) => setNewBackup({ ...newBackup, description: e.target.value })}
                    placeholder="Descrição do backup"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateBackupOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateBackup} disabled={isLoading}>
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Criar Backup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateConfigOpen} onOpenChange={setIsCreateConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Nova Configuração
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Criar Configuração de Backup</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="config-name">Nome</Label>
                    <Input
                      id="config-name"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                      placeholder="Nome da configuração"
                    />
                  </div>
                  <div>
                    <Label htmlFor="config-type">Tipo</Label>
                    <Select
                      value={newConfig.type}
                      onValueChange={(value: BackupType) => setNewConfig({ ...newConfig, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BACKUP_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="config-frequency">Frequência</Label>
                    <Select
                      value={newConfig.frequency}
                      onValueChange={(value: BackupFrequency) => setNewConfig({ ...newConfig, frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="config-time">Horário</Label>
                    <Input
                      id="config-time"
                      type="time"
                      value={newConfig.scheduleTime}
                      onChange={(e) => setNewConfig({ ...newConfig, scheduleTime: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="config-retention">Retenção (dias)</Label>
                  <Input
                    id="config-retention"
                    type="number"
                    value={newConfig.retentionDays}
                    onChange={(e) => setNewConfig({ ...newConfig, retentionDays: Number.parseInt(e.target.value) })}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateConfigOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateConfig}>
                    Criar Configuração
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-500' : 'border-green-500'}>
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total de Backups</p>
                  <p className="text-2xl font-bold">{stats.totalBackups}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Espaço Usado</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.storageUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Taxa de Sucesso</p>
                  <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">Próximo Backup</p>
                  <p className="text-2xl font-bold">
                    {stats.nextScheduledBackup
                      ? new Date(stats.nextScheduledBackup).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="backups">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Histórico de Backups</CardTitle>
                <div className="w-64">
                  <Input
                    placeholder="Buscar backups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBackups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell className="font-medium">{backup.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BACKUP_TYPE_LABELS[backup.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>{formatFileSize(backup.size)}</TableCell>
                      <TableCell>
                        {new Date(backup.createdAt).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadBackup(backup.id)}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRestoreBackup(backup.id)}>
                              <Upload className="mr-2 h-4 w-4" />
                              Restaurar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteBackup(backup.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBackups.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum backup encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Backup</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Próxima Execução</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell className="font-medium">{config.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BACKUP_TYPE_LABELS[config.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{FREQUENCY_LABELS[config.frequency]}</TableCell>
                      <TableCell>
                        {config.nextRunAt
                          ? new Date(config.nextRunAt).toLocaleDateString('pt-BR')
                          : 'Manual'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant={config.isEnabled ? 'default' : 'secondary'}>
                          {config.isEnabled ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleConfig(config.id, !config.isEnabled)}
                            >
                              {config.isEnabled ? (
                                <>
                                  <Pause className="mr-2 h-4 w-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Play className="mr-2 h-4 w-4" />
                                  Ativar
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                if (window.confirm('Tem certeza que deseja excluir esta configuração?')) {
                                  deleteBackupConfig(config.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {configs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma configuração de backup criada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Backups;
