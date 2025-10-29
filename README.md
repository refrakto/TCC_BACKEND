# README

Esse documento contém todas as rotas da API do TCC_BACKEND e quais Requests elas recebem e quais
Responses elas retornam.

A API é hospedada no localhost:3000.

OBS: Sempre que vir `'YYYY-MM-DD'`, o interprete como uma representação de uma String ISO para data,
onde YYYY equivale ao ano, MM equivale ao mês e DD equivale ao dia.

# Rotas da API

## Chuva

<table><tr><td> https://localhost:3000/chuva/</td></tr></table>

### Métodos:

#### GET

> Considere o Tipo `ChuvaGET`:
>
> ```ts
> type ChuvaGET = {
>   id: number
>   data: 'YYYY-MM-DD'
>   media: number // Média da quantidadeMm de todas medicoes
>   medicoes: {
>     idPluvi: number
>     idChuva: number
>     quantidadeMm: number // Precisão 5, escala 2 (Exemplo: 999,99)
>   }[]
> }
> ```

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

> Considere o Tipo `ChuvaPOST`:
>
> ```ts
> type ChuvaPOST = {
>   data: 'YYYY-MM-DD'
>   medicoes: {
>     idPluvi: number
>     quantidadeMm: number // Precisão 5, escala 2 (Exemplo: 999,99)
>   }[]
> }
> ```

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

> Considere o Tipo `Identificador`:
>
> ```ts
> type tipoId = { id: number }
> type tipoData = { data: 'YYYY-MM-DD' }
> type Identificador = tipoId | tipoData | tipoId & tipoData
> ```

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
  body: Identificador & {
    medicoes: {
      idPluvi: number,
      quantidadeMm: number
      //Precisão 5, escala 2
    }[]
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
  body: Identificador
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
