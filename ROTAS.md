# Rotas da API
Esse documento contém todas as rotas da API do TCC_BACKEND e quais Requests elas recebem e quais Responses elas retornam.

A API é hospedada no localhost:3000.

- [ ] Do that
- [ ] Do that

# Rotas da API

## Chuva
<table><tr><td> https://<code>endereço</code>/chuva/</td></tr></table>

### Métodos:
#### GET


> Considere o Tipo `ChuvaGET`:
> ```ts
> type ChuvaGET = {
>   id: number,
>   data: string,          // Data sempre será no formato YYYY-MM-DD
>   media: number,         // Média da quantidadeMm de todas medicoes
>   medicoes: {
>     idPluvi: number,
>     idChuva: number,
>     quantidadeMm: number,// Precisão 5, escala 2 (Exemplo: 999,99)
>   }[]
> }
> ```

**Opção 1**: enviar uma data no formato iso date, receber a chuva correspondente.
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
  status: 200
  body: {
    chuva: ChuvaGET         
  }
}
```

</td>
</tr>
</table>

**Opção 2**: enviar duas datas e receber todas as chuvas que ocorreram da primeira até a última.
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
{
  status: 200 | 207
  body: {
    chuvas: {
      sucessos: ChuvaGET[]
      erros: HTTPException[]
    }
  }
}
```

</td>
</tr>
</table>


#### POST