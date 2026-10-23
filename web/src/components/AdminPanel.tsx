import React, { useEffect, useState } from "react";
import { AdminUserItem, Channel } from "../types";
import { api } from "../services/api";
import {
  Users,
  KeyRound,
  CalendarDays,
  Tv,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  X,
  Radio,
} from "lucide-react";

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "subscriptions" | "channels">("users");
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showIptvModal, setShowIptvModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Create User Form State
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "user">("user");

  // IPTV Form State
  const [iptvUsername, setIptvUsername] = useState("");
  const [iptvPassword, setIptvPassword] = useState("");
  const [iptvHost, setIptvHost] = useState("");
  const [isTestingIptv, setIsTestingIptv] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "users" || activeTab === "subscriptions") {
        const data = await api.getAdminUsers();
        setUsers(data);
      } else if (activeTab === "channels") {
        const data = await api.getAdminChannels();
        setChannels(data);
      }
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error cargando datos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      showNotification("Usuario creado exitosamente");
      setShowCreateUserModal(false);
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error creando usuario", "error");
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar al usuario ${name}?`)) return;
    try {
      await api.deleteAdminUser(id);
      showNotification("Usuario eliminado correctamente");
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error eliminando usuario", "error");
    }
  };

  const handleOpenIptvModal = (user: AdminUserItem) => {
    setSelectedUser(user);
    setIptvUsername("");
    setIptvPassword("");
    setIptvHost("http://iptv.strongstream.net:8080");
    setTestResult(null);
    setShowIptvModal(true);
  };

  const handleSaveIptvCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.setIptvCredentials(selectedUser.id, {
        username: iptvUsername,
        password: iptvPassword,
        host: iptvHost,
      });
      showNotification("Credenciales Strong IPTV cifradas y guardadas");
      setShowIptvModal(false);
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error guardando credenciales", "error");
    }
  };

  const handleTestIptvAccount = async (userId: string) => {
    setIsTestingIptv(true);
    setTestResult(null);
    try {
      const res = await api.testIptvCredentials(userId);
      setTestResult(res);
      showNotification(res.message, res.success ? "success" : "error");
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Fallo al probar la cuenta IPTV";
      setTestResult({ success: false, message: msg });
      showNotification(msg, "error");
    } finally {
      setIsTestingIptv(false);
    }
  };

  // Subscription Actions
  const handleActivateSub = async (userId: string) => {
    try {
      await api.activateSubscription(userId);
      showNotification("Suscripción de 1 mes activada");
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error activando suscripción", "error");
    }
  };

  const handleRenewSub = async (userId: string) => {
    try {
      await api.renewSubscription(userId);
      showNotification("Suscripción renovada (+1 mes)");
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error renovando suscripción", "error");
    }
  };

  const handleSuspendSub = async (userId: string) => {
    try {
      await api.suspendSubscription(userId);
      showNotification("Suscripción suspendida");
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error suspendiendo suscripción", "error");
    }
  };

  const handleToggleChannelVisibility = async (channel: Channel) => {
    try {
      await api.updateChannel(channel.id, { isVisible: !channel.isVisible });
      showNotification(`Canal ${channel.name} ${!channel.isVisible ? "activado" : "desactivado"}`);
      loadData();
    } catch (err: unknown) {
      showNotification(err instanceof Error ? err.message : "Error actualizando canal", "error");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-xs font-mono font-bold flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-[#10b981]/20 text-[#4edea3] border-[#10b981]/40"
              : "bg-[#ef4444]/20 text-[#ffb4ab] border-[#ef4444]/40"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#262a34] gap-4">
        <div>
          <h1 className="font-headline font-bold text-2xl text-white">Panel de Administración</h1>
          <p className="text-xs text-[#86948a] font-mono">
            Control de usuarios, credenciales Strong IPTV y ciclos de suscripción mensual
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center space-x-1 bg-[#1c1f29] p-1 rounded-lg border border-[#262a34]">
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "users" ? "bg-[#4edea3] text-[#003824]" : "text-[#86948a] hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuarios ({users.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "subscriptions" ? "bg-[#4edea3] text-[#003824]" : "text-[#86948a] hover:text-white"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Suscripciones 1-Mes</span>
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "channels" ? "bg-[#4edea3] text-[#003824]" : "text-[#86948a] hover:text-white"
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Canales Fútbol</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === "users" && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-[#86948a]" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1f29] border border-[#262a34] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>
            <button
              onClick={() => setShowCreateUserModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] rounded-lg text-xs font-bold transition shadow-md shadow-[#4edea3]/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>

          <div className="bg-[#1c1f29] border border-[#262a34] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0f131c] text-[#86948a] border-b border-[#262a34]">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Rol</th>
                    <th className="py-3 px-4">Suscripción (1 Mes)</th>
                    <th className="py-3 px-4">Cuenta Strong IPTV</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262a34]">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#262a34]/40 transition">
                      <td className="py-3.5 px-4 font-sans">
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-[11px] font-mono text-[#86948a]">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "admin"
                              ? "bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30"
                              : "bg-[#262a34] text-[#dfe2ef]"
                          }`}
                        >
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.subscription ? (
                          <div className="space-y-0.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.subscription.isExpired
                                  ? "bg-[#ef4444]/20 text-[#ffb4ab]"
                                  : u.subscription.daysRemaining <= 5
                                  ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                                  : "bg-[#10b981]/20 text-[#4edea3]"
                              }`}
                            >
                              {u.subscription.isExpired ? "VENCIDA" : `ACTIVA (${u.subscription.daysRemaining}d)`}
                            </span>
                            <p className="text-[10px] text-[#86948a]">
                              Hasta: {new Date(u.subscription.endDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#86948a]">Sin suscripción</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {u.iptvAccount.configured ? (
                          <div className="flex items-center space-x-2">
                            <span
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.iptvAccount.isValid
                                  ? "bg-[#10b981]/20 text-[#4edea3]"
                                  : "bg-[#f59e0b]/20 text-[#f59e0b]"
                              }`}
                            >
                              {u.iptvAccount.isValid ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Conectada</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>Por Probar</span>
                                </>
                              )}
                            </span>
                            <button
                              onClick={() => handleTestIptvAccount(u.id)}
                              disabled={isTestingIptv}
                              title="Probar credenciales contra el servidor Xtream"
                              className="p-1 rounded bg-[#0f131c] hover:bg-[#262a34] text-[#4edea3] border border-[#3c4a42] text-[10px] flex items-center space-x-1"
                            >
                              <RotateCw className={`w-3 h-3 ${isTestingIptv ? "animate-spin" : ""}`} />
                              <span>Probar</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenIptvModal(u)}
                            className="px-2 py-1 rounded bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#4edea3] border border-[#10b981]/30 text-[10px]"
                          >
                            + Asignar IPTV
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenIptvModal(u)}
                            title="Gestionar credenciales Strong IPTV"
                            className="p-1.5 rounded bg-[#0f131c] hover:bg-[#262a34] text-[#4edea3] border border-[#3c4a42]"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            title="Eliminar usuario"
                            className="p-1.5 rounded bg-[#0f131c] hover:bg-[#262a34] text-[#ef4444] border border-[#3c4a42]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SUBSCRIPTIONS */}
      {activeTab === "subscriptions" && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#1c1f29] border border-[#262a34] rounded-xl p-4">
            <p className="text-xs font-mono text-[#86948a] mb-2">
              Regla de negocio: Cada ciclo de suscripción agrega o renueva exactamente <strong>1 mes (+30 días)</strong>.
              El scheduler en segundo plano bloquea automáticamente el reproductor cuando la suscripción llega a 0 días.
            </p>
          </div>

          <div className="bg-[#1c1f29] border border-[#262a34] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0f131c] text-[#86948a] border-b border-[#262a34]">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Fecha Inicio</th>
                    <th className="py-3 px-4">Fecha Vencimiento</th>
                    <th className="py-3 px-4">Días Restantes</th>
                    <th className="py-3 px-4 text-right">Acciones de Suscripción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262a34]">
                  {users.map((u) => {
                    const sub = u.subscription;
                    return (
                      <tr key={u.id} className="hover:bg-[#262a34]/40 transition">
                        <td className="py-3.5 px-4 font-sans font-semibold text-white">
                          {u.name}
                          <p className="text-[11px] font-mono text-[#86948a]">{u.email}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          {sub ? (
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                sub.status === "SUSPENDED"
                                  ? "bg-[#6b7280]/20 text-[#9ca3af]"
                                  : sub.isExpired
                                  ? "bg-[#ef4444]/20 text-[#ffb4ab]"
                                  : sub.daysRemaining <= 5
                                  ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                                  : "bg-[#10b981]/20 text-[#4edea3]"
                              }`}
                            >
                              {sub.status}
                            </span>
                          ) : (
                            <span className="text-[#86948a]">INACTIVA</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[#86948a]">
                          {sub ? new Date(sub.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-white">
                          {sub ? new Date(sub.endDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {sub ? `${sub.daysRemaining} días` : "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {!sub || sub.isExpired ? (
                              <button
                                onClick={() => handleActivateSub(u.id)}
                                className="px-2.5 py-1 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] rounded text-[11px] font-bold transition"
                              >
                                Activar 1 Mes
                              </button>
                            ) : (
                              <button
                                onClick={() => handleRenewSub(u.id)}
                                className="px-2.5 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/40 border border-[#10b981]/40 text-[#4edea3] rounded text-[11px] font-bold transition"
                              >
                                +1 Mes
                              </button>
                            )}

                            {sub && sub.status === "ACTIVE" && (
                              <button
                                onClick={() => handleSuspendSub(u.id)}
                                className="px-2.5 py-1 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/30 text-[#ffb4ab] rounded text-[11px] transition"
                              >
                                Suspender
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CHANNELS */}
      {activeTab === "channels" && (
        <div className="mt-6 space-y-4">
          <div className="bg-[#1c1f29] border border-[#262a34] rounded-xl p-4 flex items-center justify-between">
            <div>
              <h3 className="font-headline font-semibold text-sm text-white">Canales de Fútbol Habilitados</h3>
              <p className="text-xs text-[#86948a] font-mono">
                Solo los canales marcados como VISIBLES serán reproducibles por los usuarios suscriptores.
              </p>
            </div>
            <span className="text-xs font-mono text-[#4edea3] px-2.5 py-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30">
              {channels.filter((c) => c.isVisible).length} / {channels.length} Activos
            </span>
          </div>

          <div className="bg-[#1c1f29] border border-[#262a34] rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#0f131c] text-[#86948a] border-b border-[#262a34]">
                  <tr>
                    <th className="py-3 px-4">Canal</th>
                    <th className="py-3 px-4">Categoría / Liga</th>
                    <th className="py-3 px-4">Señal</th>
                    <th className="py-3 px-4 text-right">Visibilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262a34]">
                  {channels.map((ch) => (
                    <tr key={ch.id} className="hover:bg-[#262a34]/40 transition">
                      <td className="py-3 px-4 flex items-center space-x-2.5 font-sans font-semibold text-white">
                        <Radio className="w-4 h-4 text-[#4edea3]" />
                        <span>{ch.name}</span>
                      </td>
                      <td className="py-3 px-4 text-[#86948a]">{ch.category}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#10b981]/20 text-[#4edea3] font-bold">
                          HLS 1080p
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleChannelVisibility(ch)}
                          className={`px-3 py-1 rounded text-xs font-bold transition ${
                            ch.isVisible
                              ? "bg-[#10b981] text-[#003824] hover:bg-[#4edea3]"
                              : "bg-[#262a34] text-[#86948a] hover:bg-[#353943]"
                          }`}
                        >
                          {ch.isVisible ? "Visible" : "Oculto"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1f29] border border-[#3c4a42] rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#262a34] mb-4">
              <h3 className="font-headline font-bold text-lg text-white">Crear Nuevo Usuario</h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-[#86948a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#dfe2ef] mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Ramírez"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#dfe2ef] mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  placeholder="usuario@ejemplo.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#dfe2ef] mb-1">Contraseña</label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#dfe2ef] mb-1">Rol</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "admin" | "user")}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                >
                  <option value="user">Usuario Suscriptor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-[#262a34] text-[#dfe2ef] rounded-lg hover:bg-[#353943] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] font-bold rounded-lg transition"
                >
                  Crear Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IPTV CREDENTIALS */}
      {showIptvModal && selectedUser && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1f29] border border-[#3c4a42] rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#262a34] mb-4">
              <div>
                <h3 className="font-headline font-bold text-lg text-white">Asignar Strong IPTV</h3>
                <p className="text-xs text-[#86948a] font-mono">Usuario: {selectedUser.name}</p>
              </div>
              <button onClick={() => setShowIptvModal(false)} className="text-[#86948a] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 bg-[#0f131c] p-3 rounded-lg border border-[#262a34] text-xs font-mono text-[#86948a]">
              🔒 <strong>Seguridad:</strong> Estas credenciales se cifrarán con AES-256-GCM antes de guardarse en la base
              de datos. El cliente final nunca tendrá acceso a ellas.
            </div>

            <form onSubmit={handleSaveIptvCredentials} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#dfe2ef] mb-1">Host / DNS Xtream</label>
                <input
                  type="text"
                  required
                  placeholder="http://iptv.strongstream.net:8080"
                  value={iptvHost}
                  onChange={(e) => setIptvHost(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#dfe2ef] mb-1">IPTV Username</label>
                <input
                  type="text"
                  required
                  placeholder="strong_user_123"
                  value={iptvUsername}
                  onChange={(e) => setIptvUsername(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[#dfe2ef] mb-1">IPTV Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={iptvPassword}
                  onChange={(e) => setIptvPassword(e.target.value)}
                  className="w-full bg-[#0f131c] border border-[#262a34] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-mono flex items-start space-x-2 border ${
                    testResult.success
                      ? "bg-[#10b981]/20 text-[#4edea3] border-[#10b981]/30"
                      : "bg-[#ef4444]/20 text-[#ffb4ab] border-[#ef4444]/30"
                  }`}
                >
                  {testResult.success ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                  <span>{testResult.message}</span>
                </div>
              )}

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => handleTestIptvAccount(selectedUser.id)}
                  disabled={isTestingIptv || !selectedUser.iptvAccount.configured}
                  className="px-3 py-2 bg-[#262a34] hover:bg-[#353943] text-[#4edea3] rounded-lg flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isTestingIptv ? "animate-spin" : ""}`} />
                  <span>Probar Cuenta</span>
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowIptvModal(false)}
                    className="px-4 py-2 bg-[#262a34] text-[#dfe2ef] rounded-lg hover:bg-[#353943] transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#4edea3] hover:bg-[#10b981] text-[#003824] font-bold rounded-lg transition"
                  >
                    Cifrar y Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
