export interface DepartmentCoverage {
  departamento: string
  personas_naturales: number
  personas_juridicas: number
  total: number
  naturales_camaras: number
  naturales_libranza: number
}

export interface CoverageResult {
  success: boolean
  totales: {
    personas_naturales: number
    personas_juridicas: number
    total_personas: number
  }
  departamentos: DepartmentCoverage[]
}
