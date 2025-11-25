# README

# Instalação

## 1. Instalar o PostgreSQL 18

### Windows
1. Entre no site: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. Clique em Windows.
3. Baixe o instalador do EDB (é o padrão).
4. Abra o instalador.
5. Em "Select Components" desmarque apenas Stack Builder, a não ser que conheça e queira usar depois.
6. Em "Password" defina uma senha memorável para o superusuário. Anote se for necessário.
7. Em "Port" mantenha como 5432 ao menos que necessário trocar.
8. Avance até instalar.
9. Ao completar, desmarque a opção de iniciar o Stack Builder e finalize.

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib pgadmin4
```

### macOS
 - Se usa Homebrew:
```bash
brew install postgresql
brew services start postgresql
```
- Ou baixe o instalador no [site oficial](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads) e siga as instruções do Windows.

## 2. Abrir o pgAdmin 4

**Windows**: procure pgAdmin 4 no menu iniciar.\
**macOS/Linux**: abra normalmente pelo launcher ou procure por "pgAdmin".

Ao abrir, ele pede que você crie uma senha de segurança para o pgAdmin.
Crie uma senha e não esqueça.

## 3. Conectar ao PostgreSQL no pgAdmin

1. Na esquerda, clique em **Servers** (duplo clique).
2. Vai aparecer PostgreSQL 18, clique.
3. Ele vai pedir a senha → coloque aquela senha do usuário postgres que você criou durante a *instalação*.

Agora você está conectado ao servidor. 

## 4. Criar um novo banco de dados

1. Clique com o botão direito em Databases.
2. Clique em Create > Database.
3. No campo Database coloque o nome do seu app.
4. Clique em Save.

## 5. Inserir tabelas no banco de dados

1. Baixe o [modelo de SQL](/generated-database.sql)
2. Clique com o botão direito no banco de dados criado.
3. Clique em Restore.
4. Em Format, selecione **Plain**.
5. Em Filename, selecione o arquivo baixado.
> Caso não achar o arquivo na pasta, olhe o canto inferior direito da seleção.\
> Se tiver escrito "BACKUP File .backup (*.backup)" você deve trocar esse campo para "SQL File .sql (*.sql)"
5. Clique em Restore.

## 6. Criar usuário para o SIMPIFRJ-Backend

1. Acima de Databases, clique com o botão direito em PostgreSQL 18.
2. Clique em Create > Login/Group Role...
3. Configure cada aba:
  - Aba Geral: defina o nome.
  - Aba Definition: defina a senha em Password.
  - Aba Privileges: Marque "Can login?"
4. Clique em Save.

# Rotas da API

> [!Tip]
> No [src/main.ts](https://github.com/refrakto/TCC_BACKEND/blob/main/src/main.ts) há um `AppType` sendo exportado, que contém todos os métodos da API. Para acessá-los mais facilmente, pode-se utilizar esse AppType para criar um `hono/client` com a função `hc`.

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

