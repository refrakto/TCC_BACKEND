import { Hono } from 'hono'
import post from './post.ts'
import get from './get.ts'
import patch from './patch.ts'
import _delete from './delete.ts'
import { InferOutput } from 'valibot'
import { PluviometroSchema } from '@/valibot/pluvi.ts'
import { MedicaoSchema } from '@/valibot/chuva.ts'
import { createHTTPException } from '../../utils/errors.ts'

export default new Hono()
  .route('/chuva', post)
  .route('/chuva', get)
  .route('/chuva', patch)
  .route('/chuva', _delete)

export async function checkMedicoes(
  i: number,
  pluvi: InferOutput<typeof PluviometroSchema>,
  medicao: InferOutput<typeof MedicaoSchema>,
) {
  if (pluvi.tipo == 'automatico') {
    
    if ('quantidadeLitros' in medicao) {
      return (await createHTTPException(
        400,
        'Deve-se inserir apenas os milímetros calculados pelo pluviômetro automático.',
      )
        .getResponse()
        .json())
    } else if (medicao.quantidadeMm > (pluvi.capacidadeLitros / pluvi.areaCaptacaoM2)) {
      return (await createHTTPException(
        400,
        `Medição de índice ${i} é maior que a capacidade do pluviômetro.`,
      )
        .getResponse()
        .json())
    }
  }

  if (pluvi.tipo == 'manual') {
    if ('quantidadeMm' in medicao) {
      return (await createHTTPException(
        400,
        'Deve-se inserir apenas os litros armazenados pelo pluviômetro manual.',
      )
        .getResponse()
        .json())
    } else if (medicao.quantidadeLitros > pluvi.capacidadeLitros) {
      return (await createHTTPException(
        400,
        `Medição de índice ${i} é maior que a capacidade do pluviômetro.`,
      )
        .getResponse()
        .json())
    }
  }
}
