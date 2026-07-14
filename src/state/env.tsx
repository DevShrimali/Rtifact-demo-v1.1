import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { defaultEnvironmentId, environments } from '../mock/environments'
import type { Environment } from '../mock/environments'
import { getClusters } from '../mock/infra'

interface EnvContextValue {
  /* primary env — the first selected. Every single-env surface reads this,
     so existing pages keep working unchanged. */
  env: Environment
  environments: Environment[]
  /* multi-select (DEV-27): one or more environments can be active at once */
  selectedIds: string[]
  selectedEnvs: Environment[]
  selectedClusters: string[]
  aggregating: boolean
  toggleEnv: (id: string) => void
  selectOnly: (id: string) => void
  /* legacy single-select entry point — now selects exactly one */
  switchEnv: (id: string) => void
  /* increments on every change — lets consumers replay "env switched" affordances */
  switchCount: number
  /* connect a new environment */
  addEnvironment: (newEnv: { name: string; provider: string; region: string; clusters?: string[] }) => void
  toggleCluster: (id: string) => void
  selectAllClusters: () => void
  clearAllClusters: () => void
}

const EnvContext = createContext<EnvContextValue | null>(null)

const STORAGE_KEY = 'rtifact.envs'
const ENVS_LIST_KEY = 'rtifact.environments'
const CLUSTERS_KEY = 'rtifact.clusters'

function loadEnvironments(): Environment[] {
  const stored = localStorage.getItem(ENVS_LIST_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      // ignore
    }
  }
  return environments
}

export function EnvProvider({ children }: { children: ReactNode }) {
  const [envList, setEnvList] = useState<Environment[]>(loadEnvironments)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const ids = stored.split(',').filter((id) => envList.some((e) => e.id === id))
      if (ids.length > 0) return ids
    }
    return [defaultEnvironmentId]
  })

  // Selected clusters state
  const [selectedClusters, setSelectedClusters] = useState<string[]>(() => {
    const stored = localStorage.getItem(CLUSTERS_KEY)
    if (stored) {
      return stored.split(',').filter(Boolean)
    }
    // Default: select all clusters in the initially selected environments
    const initialEnvs = selectedIds.length > 0 ? selectedIds : [defaultEnvironmentId]
    return initialEnvs.flatMap(envId => getClusters(envId).map(c => c.id))
  })

  const [switchCount, setSwitchCount] = useState(0)

  const value = useMemo<EnvContextValue>(() => {
    const persistSelection = (envIds: string[], clusterIds: string[]) => {
      localStorage.setItem(STORAGE_KEY, envIds.join(','))
      localStorage.setItem(CLUSTERS_KEY, clusterIds.join(','))
      setSelectedIds(envIds)
      setSelectedClusters(clusterIds)
      setSwitchCount((n) => n + 1)
    }

    /* keep selection in the canonical environments order */
    const ordered = envList.filter((e) => selectedIds.includes(e.id))
    const selectedEnvs = ordered.length > 0 ? ordered : [envList[0]]

    return {
      env: selectedEnvs[0],
      environments: envList,
      selectedIds: selectedEnvs.map((e) => e.id),
      selectedEnvs,
      selectedClusters,
      aggregating: selectedEnvs.length > 1,

      toggleEnv: (id: string) => {
        const envClusters = getClusters(id).map((c) => c.id)
        const isEnvSelected = selectedIds.includes(id)
        let nextEnvIds: string[]
        let nextClusters: string[]

        if (isEnvSelected) {
          nextEnvIds = selectedIds.filter((x) => x !== id)
          nextClusters = selectedClusters.filter((x) => !envClusters.includes(x))
          if (nextEnvIds.length === 0) {
            // Keep at least this env selected
            nextEnvIds = [id]
            nextClusters = envClusters
          }
        } else {
          nextEnvIds = [...selectedIds, id]
          nextClusters = Array.from(new Set([...selectedClusters, ...envClusters]))
        }
        persistSelection(nextEnvIds, nextClusters)
      },

      selectOnly: (id: string) => {
        const envClusters = getClusters(id).map((c) => c.id)
        persistSelection([id], envClusters)
      },

      switchEnv: (id: string) => {
        const envClusters = getClusters(id).map((c) => c.id)
        persistSelection([id], envClusters)
      },

      switchCount,

      addEnvironment: (newEnv) => {
        const id = newEnv.name.toLowerCase().replace(/\s+/g, '-') + '-' + Math.random().toString(36).substring(2, 5)
        
        // Use supplied clusters or create a default cluster for this environment
        const newClusters = newEnv.clusters && newEnv.clusters.length > 0
          ? newEnv.clusters
          : [`k8s-${id}-1`]

        const fullEnv: Environment = {
          id,
          name: newEnv.name,
          provider: newEnv.provider,
          region: newEnv.region,
          health: 'healthy',
          clusters: newClusters.length,
          activeAlerts: 0,
          criticalAlerts: 0,
        }

        const nextList = [...envList, fullEnv]
        localStorage.setItem(ENVS_LIST_KEY, JSON.stringify(nextList))
        setEnvList(nextList)

        // Select the newly added environment and its clusters
        const nextEnvIds = [id]
        persistSelection(nextEnvIds, newClusters)
      },

      toggleCluster: (clusterId: string) => {
        let nextClusters = selectedClusters.includes(clusterId)
          ? selectedClusters.filter((x) => x !== clusterId)
          : [...selectedClusters, clusterId]

        if (nextClusters.length === 0) {
          // Keep at least this cluster selected
          nextClusters = [clusterId]
        }

        // Recompute active envs based on which environments have at least one selected cluster
        const nextEnvIds = envList
          .filter((e) => {
            const envClusters = getClusters(e.id).map((c) => c.id)
            return envClusters.some((cId) => nextClusters.includes(cId))
          })
          .map((e) => e.id)

        persistSelection(nextEnvIds.length > 0 ? nextEnvIds : [selectedIds[0]], nextClusters)
      },

      selectAllClusters: () => {
        const allEnvIds = envList.map((e) => e.id)
        const allClusters = envList.flatMap((e) => getClusters(e.id).map((c) => c.id))
        persistSelection(allEnvIds, allClusters)
      },

      clearAllClusters: () => {
        // Fallback to first env and its clusters
        const firstEnvId = envList[0].id
        const firstEnvClusters = getClusters(firstEnvId).map((c) => c.id)
        persistSelection([firstEnvId], firstEnvClusters)
      },
    }
  }, [selectedIds, selectedClusters, envList, switchCount])

  return <EnvContext.Provider value={value}>{children}</EnvContext.Provider>
}

export function useEnv(): EnvContextValue {
  const ctx = useContext(EnvContext)
  if (!ctx) throw new Error('useEnv must be used inside <EnvProvider>')
  return ctx
}
