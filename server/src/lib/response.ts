export const ok = (res: any, data: any, message = 'Success') =>
  res.json({ success: true, data, message })

export const created = (res: any, data: any, message = 'Created') =>
  res.status(201).json({ success: true, data, message })
