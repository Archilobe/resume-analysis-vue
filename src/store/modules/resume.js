import { getResume, getResumeList, deleteResume } from '@/api/resume'
import { loadDefaultLookup } from '@/utils/directoryLookup'
import { runWarnings } from '@/utils/warningEngine'

export default {
  namespaced: true,
  state: () => ({ list: [], current: null, lookup: null }),
  mutations: {
    SET_LIST(state, list) { state.list = list },
    SET_CURRENT(state, r) { state.current = r },
    SET_LOOKUP(state, l) { state.lookup = l }
  },
  actions: {
    async initLookup({ commit, state }) {
      if (!state.lookup) commit('SET_LOOKUP', await loadDefaultLookup())
      return state.lookup
    },
    async fetchList({ commit }) {
      commit('SET_LIST', await getResumeList())
    },
    async fetchDetail({ commit }, id) {
      const r = await getResume(id)
      commit('SET_CURRENT', r)
      return r
    },
    async remove({ dispatch }, id) {
      await deleteResume(id)
      await dispatch('fetchList')
    },
    async computeWarnings({ state }, resume) {
      const lookup = await loadDefaultLookup()
      return runWarnings(resume, lookup)
    }
  },
  getters: {
    warnMap(state) {
      // {'basic.name': 'high', ...}
      const map = {}
      for (const w of state.current?.warnings || []) {
        for (const p of w.fieldMarks) if (!map[p] || map[p] === 'medium') map[p] = w.level
      }
      // high 覆盖 medium
      for (const w of state.current?.warnings || []) {
        if (w.level === 'high') for (const p of w.fieldMarks) map[p] = 'high'
      }
      return map
    },
    warnCount(state) { return state.current?.warnings?.length || 0 }
  }
}
