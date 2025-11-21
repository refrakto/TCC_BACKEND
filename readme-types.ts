type Permissoes = { permissao: 'admin' } | {
  permissao: 'estagiario'
  dataInicio: string | null
  dataFim: string | null
}

type UsuarioGET = {
  id: number
  nome: string
  email: string
} & Permissoes

type UsuarioPOST = {
  nome: string
  email: string
} & Permissoes

type PluviGET = {
  id: number
  nome: string // Máximo 100 caracteres
  tipo: 'manual' | 'automatico'
  capacidadeLitros: number // Precisão 5, escala 2
  areaCaptacaoM2: number // Precisão 5, escala 4
  latitude?: number // -90 a 90, 6 casas decimais
  longitude?: number // -180 a 180, 6 casas decimais
  altitude?: number // 2 casas decimais
  arquivado?: boolean // Default: false
}

type PluviPOST = {
  nome: string
  tipo: 'manual' | 'automatico'
  capacidadeLitros: number // Precisão 5, escala 2
  areaCaptacaoM2: number // Precisão 5, escala 4
  latitude: number | null // -90 a 90, 6 casas decimais
  longitude: number | null // -180 a 180, 6 casas decimais
  altitude: number | null // 2 casas decimais
  arquivado: boolean
}

type ChuvaGET = {
  id: number
  data: 'YYYY-MM-DD'
  media: number // Média da quantidadeMm de todas medicoes
  medicoes: {
    idPluvi: number
    idChuva: number
    quantidadeMm: number // Precisão 5, escala 3 (Exemplo: 99,999)
    quantidadeLitros: number // Precisão 5, escala 2 (Exemplo: 99999)
  }[]
}

type MedidasInsert = { 
  //Apenas para pluviômetros automáticos
  idPluvi: number 
  quantidadeMm: number // Precisão 5, escala 3 (Exemplo: 99,999)
} | {
  //Apenas para pluviômetros manuais
  idPluvi: number 
  quantidadeLitros: number // Precisão 5, escala 2 (Exemplo: 99999)
}

type ChuvaPOST = {
  data: 'YYYY-MM-DD'
  medicoes: MedidasInsert[]
}

type tipoId = { id: number }
type tipoData = { data: 'YYYY-MM-DD' }
type ChuvaProcura = tipoId | tipoData | tipoId & tipoData

type ChuvaPatch = ChuvaProcura & {
  medicoes: MedidasInsert[]
}