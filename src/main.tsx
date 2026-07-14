import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import { EnvProvider } from './state/env'
import { ThemeProvider } from './state/theme'
import { PersonaProvider } from './state/persona'
import { AppShell } from './shell/AppShell'
import { CommandPage } from './pages/CommandPage'
import { AlertDetailPage } from './pages/AlertDetailPage'
import { IncidentsListPage } from './pages/IncidentsListPage'
import { IncidentDetailPage } from './pages/IncidentDetailPage'
import { ClusterPage } from './pages/ClusterPage'
import { PodPage } from './pages/PodPage'
import { WorkflowListPage } from './pages/automate/WorkflowListPage'
import { WorkflowBuilderPage } from './pages/automate/WorkflowBuilderPage'
import { PlaybooksPage, RunbookDetailPage } from './pages/automate/PlaybooksPage'
import { SilencesPage } from './pages/automate/SilencesPage'
import { AuditLogPage, ExecutionsPage, TemplatesPage } from './pages/automate/AutomateExtrasPages'
import { AutomateLayout } from './pages/automate/AutomateLayout'
import { ReviewLayout } from './pages/review/ReviewLayout'
import { SummaryPage } from './pages/review/SummaryPage'
import { MetricsReportPage } from './pages/review/MetricsReportPage'
import { InventoryPage } from './pages/review/InventoryPage'
import { CasesPage } from './pages/support/CasesPage'
import { CaseDetailPage } from './pages/support/CaseDetailPage'
import { SitesPage } from './pages/support/SitesPage'
import { SiteDetailPage } from './pages/support/SiteDetailPage'
import { PublicStatusPage } from './pages/support/PublicStatusPage'
import { sites } from './mock/support'
import { AgentsPage } from './pages/settings/AgentsPage'
import {
  AutomationPoliciesPage,
  ConfidencePoliciesPage,
  InvestigationPage,
  RecoveryPage,
} from './pages/settings/PoliciesPages'
import { KnowledgePage } from './pages/settings/KnowledgePage'
import { ProfilePage } from './pages/settings/ProfilePage'
import { SettingsLayout } from './pages/settings/SettingsLayout'
import { ImpactPolicyPage } from './pages/settings/ImpactPolicyPage'
import {
  ConnectionsPage,
  CustomFieldsPage,
  OrganizationPage,
  UsersPage,
  ThemingPage,
} from './pages/settings/AdminPages'
import {
  FirstEnvPage,
  LoginPage,
  OnboardingLayout,
  PairingPage,
  ProviderPage,
  ScanPage,
} from './pages/onboarding/OnboardingPages'
import { TelemetryLayout } from './pages/telemetry/TelemetryLayout'
import { IntelligencePage } from './pages/telemetry/IntelligencePage'
import { MetricsPage } from './pages/telemetry/MetricsPage'
import { LogsPage } from './pages/telemetry/LogsPage'
import { TracesPage } from './pages/telemetry/TracesPage'
import { SyntheticPage } from './pages/telemetry/SyntheticPage'
import { SyntheticDetailPage } from './pages/telemetry/SyntheticDetailPage'
import { SavedViewsPage } from './pages/telemetry/SavedViewsPage'

const router = createBrowserRouter([
  {
    path: '/status/:siteId',
    element: <PublicStatusPage />,
  },
  /* Screens 59–63 — onboarding lives outside the app shell */
  {
    element: <OnboardingLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/onboarding/provider', element: <ProviderPage /> },
      { path: '/onboarding/pairing', element: <PairingPage /> },
      { path: '/onboarding/scan', element: <ScanPage /> },
      { path: '/onboarding/live', element: <FirstEnvPage /> },
    ],
  },
  {
    path: '/',
    element: <AppShell />,
    children: [
      /* Command opens directly to the Alerts board — no Overview screen
         (resolved-conflicts.md #4) */
      { index: true, element: <Navigate to="/command" replace /> },
      {
        path: 'command',
        handle: { crumb: () => 'Command' },
        children: [
          { index: true, element: <CommandPage /> },
          {
            path: 'alerts/:alertId',
            element: <AlertDetailPage />,
            handle: {
              crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                params.alertId ?? 'Alert',
            },
          },
          {
            path: 'incidents',
            handle: { crumb: () => 'Incidents' },
            children: [
              { index: true, element: <IncidentsListPage /> },
              {
                path: ':incidentId',
                element: <IncidentDetailPage />,
                handle: {
                  crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                    params.incidentId ?? 'Incident',
                },
              },
            ],
          },
          {
            /* env › cluster › pod drill (DEV-8): cluster is Secondary,
               pod is Tertiary — breadcrumb never exceeds 3 tiers */
            path: 'clusters/:clusterId',
            handle: {
              crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                params.clusterId ?? 'Cluster',
            },
            children: [
              { index: true, element: <ClusterPage /> },
              {
                path: 'pods/:podId',
                element: <PodPage />,
                handle: {
                  crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                    params.podId ?? 'Pod',
                },
              },
            ],
          },
          {
            path: 'telemetry',
            handle: { crumb: () => 'Telemetry' },
            element: <TelemetryLayout />,
            children: [
              { index: true, element: <Navigate to="intelligence" replace /> },
              { path: 'intelligence', element: <IntelligencePage />, handle: { crumb: () => 'Intelligence' } },
              { path: 'metrics', element: <MetricsPage />, handle: { crumb: () => 'Metrics' } },
              { path: 'logs', element: <LogsPage />, handle: { crumb: () => 'Logs' } },
              { path: 'traces', element: <TracesPage />, handle: { crumb: () => 'Traces' } },
              { path: 'synthetic', element: <SyntheticPage />, handle: { crumb: () => 'Synthetic' } },
              {
                /* detail sits directly under Telemetry so the breadcrumb
                   stays 3 tiers: Command / Telemetry / <check> */
                path: 'synthetic/:checkId',
                element: <SyntheticDetailPage />,
                handle: {
                  crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                    params.checkId ?? 'Check',
                },
              },
              { path: 'views', element: <SavedViewsPage />, handle: { crumb: () => 'Saved Views' } },
            ],
          },
        ],
      },
      {
        path: 'review',
        handle: { crumb: () => 'Review' },
        element: <ReviewLayout />,
        children: [
          { index: true, element: <SummaryPage /> },
          { path: 'metrics', element: <MetricsReportPage />, handle: { crumb: () => 'Metrics' } },
          { path: 'inventory', element: <InventoryPage />, handle: { crumb: () => 'Inventory' } },
          /* old per-pillar paths now live as Inventory categories — redirect */
          { path: 'security', element: <Navigate to="/review/inventory?cat=security" replace /> },
          { path: 'cost', element: <Navigate to="/review/inventory?cat=cost" replace /> },
          { path: 'reliability', element: <Navigate to="/review/inventory?cat=reliability" replace /> },
          { path: 'insights', element: <Navigate to="/review/inventory?cat=cloud" replace /> },
          { path: 'environments', element: <Navigate to="/review/inventory?cat=environments" replace /> },
          { path: 'access', element: <Navigate to="/review/inventory?cat=access" replace /> },
        ],
      },
      {
        path: 'automate',
        handle: { crumb: () => 'Automate' },
        element: <AutomateLayout />,
        children: [
          { index: true, element: <WorkflowListPage /> },
          {
            path: 'workflows/new',
            element: <WorkflowBuilderPage />,
            handle: { crumb: () => 'New workflow' },
          },
          {
            path: 'playbooks',
            handle: { crumb: () => 'Playbooks' },
            children: [
              { index: true, element: <PlaybooksPage /> },
              {
                path: ':runbookId',
                element: <RunbookDetailPage />,
                handle: {
                  crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                    params.runbookId ?? 'Runbook',
                },
              },
            ],
          },
          { path: 'silences', element: <SilencesPage />, handle: { crumb: () => 'Silences' } },
          { path: 'templates', element: <TemplatesPage />, handle: { crumb: () => 'Templates' } },
          { path: 'executions', element: <ExecutionsPage />, handle: { crumb: () => 'Executions' } },
          { path: 'audit', element: <AuditLogPage />, handle: { crumb: () => 'Audit Log' } },
        ],
      },
      {
        path: 'support',
        handle: { crumb: () => 'Support' },
        children: [
          { index: true, element: <CasesPage /> },
          {
            path: 'cases/:caseId',
            element: <CaseDetailPage />,
            handle: {
              crumb: (_d: unknown, params: Record<string, string | undefined>) =>
                params.caseId ?? 'Case',
            },
          },
          {
            path: 'status-pages',
            handle: { crumb: () => 'Status Pages' },
            children: [
              { index: true, element: <SitesPage /> },
              {
                path: 'new',
                element: <SitesPage />,
                handle: { crumb: () => 'Create' },
              },
              {
                path: ':siteId',
                element: <SiteDetailPage />,
                handle: {
                  crumb: (_d: unknown, params: Record<string, string | undefined>) => {
                    const id = params.siteId
                    const found = sites.find((s) => s.id === id)
                    return found?.name ?? id ?? 'Site'
                  },
                },
              },
            ],
          },
        ],
      },
      {
        path: 'settings',
        handle: { crumb: () => 'Settings' },
        element: <SettingsLayout />,
        children: [
          { index: true, element: <AgentsPage /> },
          { path: 'investigation', element: <InvestigationPage />, handle: { crumb: () => 'Investigation' } },
          { path: 'confidence', element: <ConfidencePoliciesPage />, handle: { crumb: () => 'Confidence' } },
          { path: 'automation', element: <AutomationPoliciesPage />, handle: { crumb: () => 'Automation' } },
          { path: 'impact', element: <ImpactPolicyPage />, handle: { crumb: () => 'Impact Policy' } },
          { path: 'recovery', element: <RecoveryPage />, handle: { crumb: () => 'Recovery' } },
          { path: 'knowledge', element: <KnowledgePage />, handle: { crumb: () => 'Knowledge' } },
          { path: 'connections', element: <ConnectionsPage />, handle: { crumb: () => 'Connections' } },
          { path: 'users', element: <UsersPage />, handle: { crumb: () => 'Users & Roles' } },
          { path: 'fields', element: <CustomFieldsPage />, handle: { crumb: () => 'Custom Fields' } },
          { path: 'organization', element: <OrganizationPage />, handle: { crumb: () => 'Organization' } },
          { path: 'theming', element: <ThemingPage />, handle: { crumb: () => 'Theming' } },
          { path: 'profile', element: <ProfilePage />, handle: { crumb: () => 'Profile' } },
        ],
      },
      { path: '*', element: <Navigate to="/command" replace /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PersonaProvider>
        <EnvProvider>
          <RouterProvider router={router} />
        </EnvProvider>
      </PersonaProvider>
    </ThemeProvider>
  </StrictMode>,
)
