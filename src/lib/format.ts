const LANGUAGE = 'vi'

export const formatRoleStatusText = (isActive: boolean) => {
  switch (isActive) {
    case true:
      return LANGUAGE === 'vi' ? 'Hoạt động' : 'Active'
    case false:
      return LANGUAGE === 'vi' ? 'Dừng hoạt động' : 'Inactive'
  }
}
