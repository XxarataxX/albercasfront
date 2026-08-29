const BRANCH_ALIASES = {
  bugambilias: 'Bugambilias',
  chapalita: 'Chapalita',
  sanjorge: 'San Jorge',
  'san-jorge': 'San Jorge',
  solares: 'Solares',
  aguascalientes: 'Aguascalientes',
  puebla: 'Puebla',
  santaanita: 'Santa Anita',
  'santa-anita': 'Santa Anita',
};

export const getBranchScope = () => {
  const raw = process.env.REACT_APP_BRANCH_SCOPE || '';
  const normalized = raw.trim().toLowerCase();
  return BRANCH_ALIASES[normalized] || raw.trim() || null;
};

export const withBranchParams = (params = {}) => {
  const branchKey = getBranchScope();
  if (!branchKey || params.branchKey || params.branch_key || params.poolId || params.pool_id) {
    return params;
  }
  return { ...params, branchKey };
};

export const withBranchPayload = (data = {}) => {
  const branchKey = getBranchScope();
  if (!branchKey || data.branchKey || data.branch_key || data.poolId || data.pool_id) {
    return data;
  }
  return { ...data, branchKey };
};
