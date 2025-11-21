# README



# Rotas da API

Esse documento contém todas as rotas da API do TCC_BACKEND e quais Requests elas recebem e quais
Responses elas retornam.

As rotas utilizarão como referência o endereço padrão `localhost:3000`.

OBS: Sempre que vir `'YYYY-MM-DD'`, o interprete como uma representação de uma String ISO para data,
onde YYYY equivale ao ano, MM equivale ao mês e DD equivale ao dia.

Para cada rota será definido em Typescript os **Tipos** de objetos que se repetem.

## Autenticação


### Tipos

```typescript
type Permissoes = { permissao: 'admin' } | {
  permissao: 'estagiario'
  dataInicio: string | null
  dataFim: string | null
}
```

```typescript
type UsuarioGET = {
  id: number
  nome: string
  email: string
} & Permissoes
```

```typescript
type UsuarioPOST = {
  nome: string
  email: string
} & Permissoes
```
Esses tipos também são utilizados para a rota [Contas](#contas)

### /auth/login

<table><tr><td> https://localhost:3000/auth/login</td></tr></table>

**Método:** POST

**O que faz?** Enviar email e senha para receber um token de autenticação.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  body: {
    email: string, // Máximo 100 caracteres, formato de email válido
    senha: string // Mínimo 8 caracteres
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Usuário autenticado com sucesso',
    token: string, // JWT Token válido por 24h
    usuario: UsuarioGET
  }
}
```

</td>
</tr>
</table>

<br/>

### /auth/check

<table><tr><td> https://localhost:3000/auth/check</td></tr></table>

**Método:** GET

**O que faz?** Verificar se um token JWT é válido e retornar os dados do usuário.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // JWT Token
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Usuário autenticado com sucesso',
    usuario: UsuarioGET
  }
}
```

</td>
</tr>
</table>

<br/>

### /auth/logout

<table><tr><td> https://localhost:3000/auth/logout</td></tr></table>

**Método:** POST

**O que faz?** Invalidar um token de autenticação.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // JWT Token
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Token invalidado com sucesso.'
  }
}
```

</td>
</tr>
</table>

<br/>

<br/>

## Contas


<table><tr><td> https://localhost:3000/contas/</td></tr></table>

### Tipos

[São os mesmos tipos de Autenticação](#tipos)

### Métodos:

#### POST

**O que faz?** Cadastrar um ou mais usuários no sistema.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: UsuarioPOST[]
}
```

</td><td>

```typescript
{
  status: 201,
  body: {
    message: 'Usuários cadastrados com sucesso.',
    usuarios: UsuarioGET[]
  }
}
```

</td>
</tr>
</table>

<br/>

#### PATCH

**O que faz?** Atualizar os dados de um ou mais usuários existentes.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: {
    selecao: string, // Email do usuário
    edicao: Partial<UsuarioPOST>
  }[]
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Usuários atualizados com sucesso.',
    usuarios: UsuarioGET[]
  }
}
```

</td>
</tr>
</table>

<br/>

#### DELETE

**O que faz?** Excluir um usuário do sistema.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: {
    id: number, // ID do usuário
  } | {
    email: string // Email do usuário
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Usuário deletado com sucesso.',
    usuario: UsuarioGET
  }
}
```

</td>
</tr>
</table>

<br/>

## Pluviômetros

<table><tr><td> https://localhost:3000/pluvi/</td></tr></table>

### Tipos

```typescript
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
```
```typescript
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
```

### Métodos:

#### GET

**O que faz?** Listar todos os pluviômetros cadastrados.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{ 
  //Nada 
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Pluviômetros enviados com sucesso.',
    pluvis: PluviGET[]
  }
}
```

</td>
</tr>
</table>

<br/>

#### POST

**O que faz?** Cadastrar um novo pluviômetro.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: PluviPOST
}
```

</td><td>

```typescript
{
  status: 201,
  body: {
    message: 'Pluviômetro cadastrado com sucesso.',
    pluvi: PluviGET
  }
}
```

</td>
</tr>
</table>

<br/>

#### PATCH

**O que faz?** Atualizar os dados de um pluviômetro existente.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: {
    id: number
    } & Partial<PluviPOST>
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Pluviômetro atualizado com sucesso',
    pluvi: PluviometroGET
  }
}
```

</td>
</tr>
</table>

<br/>

#### DELETE

**O que faz?** Excluir um pluviômetro do sistema.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...' // Token de admin
  },
  body: {
    id: number // ID do pluviômetro
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Pluviômetro deletado com sucesso.',
    pluvi: PluviGET
  }
}
```

</td>
</tr>
</table>

<br/>

## Chuva

<table><tr><td> https://localhost:3000/chuva/</td></tr></table>

### Tipos



```typescript
type MedidasInsert = { 
  // APENAS para pluviômetros automáticos
  idPluvi: number 
  quantidadeMm: number // Precisão 5, escala 3 (Exemplo: 99,999)
} | {
  // APENAS para pluviômetros manuais
  idPluvi: number 
  quantidadeLitros: number // Precisão 5, escala 2 (Exemplo: 99999)
}
```

```typescript
type tipoId = { id: number }
type tipoData = { data: 'YYYY-MM-DD' }

type ChuvaProcura = tipoId | tipoData | tipoId & tipoData
```

```typescript
type ChuvaPOST = {
  data: 'YYYY-MM-DD'
  medicoes: MedidasInsert[]
}
```

```typescript
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
```

### Métodos:

#### GET

**Opção 1**: <br/> **O que faz?** Enviar uma data no formato iso date, receber a chuva
correspondente.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  body: {
    data: 'YYYY-MM-DD'
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Chuva enviada com sucesso.',
    chuva: ChuvaGET
  }
}
```

</td>
</tr>
</table>

**Opção 2**: <br/> **O que faz?** Enviar duas datas e receber todas as chuvas que ocorreram da
primeira até a última.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  body: {
    dataPrimeira: 'YYYY-MM-DD',
    dataUltima: 'YYYY-MM-DD'
  }
}
```

</td><td>

```typescript
//Sucesso Total
{
  status: 200,
  body: {
    chuvas: {
      message: 'Chuvas enviadas com sucesso.',
      sucessos: ChuvaGET[],
    }
  }
}

//Sucesso Parcial
{
  status: 207,
  body: {
    chuvas: {
      message: 'Sucesso parcial ao enviar chuvas.',    
      sucessos: ChuvaGET[],
      erros: {
        message: string,
        id: number?,
        data: 'YYYY-MM-DD'?
      }[]
    }
  }
}
```

</td>
</tr>
</table>

<br/>

#### POST

**O que faz?** Enviar os dados de uma Chuva e suas medições para registrá-la no banco de dados.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...'
  },
  body: ChuvaPOST
}
```

</td><td>

```typescript
{
  status: 201,
  body: {
    message: 'Chuva e medições inseridas com sucesso.',
    chuva: ChuvaGET
  }
}
```

</td>
</tr>
</table>

<br/>


#### PATCH

**O que faz?** Edita a quantidadeMm das medições já registradas de uma chuva já existente.



<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...'
  },
  body: ChuvaProcura & {
    medicoes: MedidasInsert[]
  }
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Medições atualizadas com sucesso.',      
    chuva: ChuvaGET
  }
}
```

</td>
</tr>
</table>

<br/>

#### DELETE

**O que faz?** Exclui uma chuva e todas as suas medições do sistema.

<table>
<tr>
<th>Entrada (Request)</th> <th>Saída (Response)</th>
</tr>
<tr>
<td>

```typescript
{
  header: {
    authorization: 'Bearer ...'
  },
  body: ChuvaProcura
}
```

</td><td>

```typescript
{
  status: 200,
  body: {
    message: 'Chuva e medições deletadas com sucesso.',
    chuva: ChuvaGET
  }
}
```

</td>
</tr>
</table>

