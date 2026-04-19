import api from '../../services/api';

const aiApi = {
  /**
   * Patient chat — sends message, gets AI reply based on patient's own records.
   * @param {string} message
   * @returns {Promise<{ reply: string }>}
   */
  patientChat: async (message) => {
    const res = await api.post('/ai/patient-chat', { message });
    return res.data?.data ?? res.data;
  },

  /**
   * Doctor summary — fetches AI-generated pre-consultation briefing.
   * @param {string} patientId
   * @returns {Promise<{ summary: string, structured: object }>}
   */
  doctorSummary: async (patientId) => {
    const res = await api.get(`/ai/doctor-summary/${patientId}`);
    return res.data?.data ?? res.data;
  },
};

export default aiApi;
