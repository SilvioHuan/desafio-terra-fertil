
export const MUDAS_POR_BANDEJA = 50;

export type SituacaoCadastral = "regular" | "suspensa" | "irregular";
export interface Associacao {
    cnpj: string;
    nome: string;
    municipio: string;
    familias: number;
    cotaMaxima: number;
    situacao: SituacaoCadastral;
}

export interface Distribuicao {
    cnpj: string;
    nome: string;
    bandejas: number;
    mudas: number;
    motivoExclusao?: string;
}

export interface ResultadoRateio {
    distribuicao: Distribuicao[];
    totalDistribuido: number;
    sobraNaoDistribuida: number;
}
export class RateioError extends Error {

}

export function ratearMudas(totalMudas: number, associacoes: Associacao[]): ResultadoRateio {

    if (!Number.isInteger(totalMudas) && typeof totalMudas === 'number' && !Number.isNaN(totalMudas)) {
        throw new RateioError(`O campo totalMudas não pode ser um número flutuante, deve ser um inteiro positivo. O valor atual é ${totalMudas}`)
    }

    if (totalMudas <= 0) {
        throw new RateioError(`totalMudas não pode receber valores negativos ou zero.`)
    }


    associacoes.forEach((associacao) => {
        if (associacao.cotaMaxima < 0) {
            throw new RateioError(`Associação ${associacao.nome} de CNPJ ${associacao.cnpj} possui uma cota máxima negativa de ${associacao.cotaMaxima}`)
        }

        if (associacao.familias < 0) {
            throw new RateioError(`Associação ${associacao.nome} de CNPJ ${associacao.cnpj} possui um número de famílias negativo de ${associacao.familias}`)
        }

        if (!Number.isInteger(associacao.cotaMaxima) && typeof associacao.cotaMaxima === 'number' && !Number.isNaN(associacao.cotaMaxima)) {
            throw new RateioError(`Associação ${associacao.nome} de CNPJ ${associacao.cnpj} não deve ter o valor da cota máxima como um número flutuante, valor encontrado de cotaMaxima é ${associacao.cotaMaxima}`)
        }

        if (!Number.isInteger(associacao.familias) && typeof associacao.familias === 'number' && !Number.isNaN(associacao.familias)) {
            throw new RateioError(`Associação ${associacao.nome} de CNPJ ${associacao.cnpj} não deve ter o valor das famílias como um número flutuante, valor encontrado de familias é ${associacao.familias}`)
        }
    })

    for (let i: number = 0; i < associacoes.length; i++) {
        for (let k: number = 0; k < associacoes.length; k++) {
            const associadoAlvo = associacoes[k]
            const associadoComparado = associacoes[i]

            if (i !== k) {
                if (associadoAlvo.cnpj === associadoComparado.cnpj) {
                    throw new RateioError(`CNPJs duplicados: ${JSON.stringify(associacoes.map(a => a.cnpj))}`)
                }
            }
        }
    }

    let somaDasFamilias = associacoes.reduce((valorAtual, associacao) => {
        if (associacao.situacao === "regular") {
            return valorAtual + associacao.familias
        }
        return valorAtual
    }, 0)

    let restos = totalMudas % MUDAS_POR_BANDEJA

    let loteDisponivel = Math.floor(totalMudas / MUDAS_POR_BANDEJA)

    let loteRetirar = 0;

    let retirarFamilias = 0;

    const primeiraDistribuicao: Distribuicao[] = associacoes.map(associacao => {

        const bandejasMaxima = associacao.cotaMaxima / MUDAS_POR_BANDEJA

        const cotaIdeal = loteDisponivel * associacao.familias / somaDasFamilias

        const bandejaEncontrada = Math.floor(cotaIdeal) > bandejasMaxima ? bandejasMaxima : Math.floor(cotaIdeal)

        const bandejaDisponível = loteDisponivel > bandejaEncontrada ? bandejaEncontrada : loteDisponivel

        if (bandejaDisponível == bandejasMaxima) {
            retirarFamilias += associacao.familias
            loteRetirar += bandejasMaxima
        }
        if (associacao.situacao !== "regular") {
            const distribuido: Distribuicao = {
                nome: associacao.nome,
                cnpj: associacao.cnpj,
                bandejas: 0,
                mudas: 0,
                motivoExclusao: associacao.situacao
            }
            return distribuido
        }

        const distribuicao: Distribuicao = {
            nome: associacao.nome,
            cnpj: associacao.cnpj,
            bandejas: bandejaDisponível,
            mudas: bandejaDisponível * MUDAS_POR_BANDEJA
        }

        return distribuicao
    })

    loteDisponivel -= loteRetirar
    somaDasFamilias -= retirarFamilias

    while (loteDisponivel > 0) {

        loteRetirar = 0
        retirarFamilias = 0
        const distribuicaoRepescada = associacoes.filter(a => primeiraDistribuicao.some(dis => dis.cnpj === a.cnpj && a.cotaMaxima / MUDAS_POR_BANDEJA > dis.bandejas))

        if (distribuicaoRepescada.length > 0) {

            if (distribuicaoRepescada.length > 1) {

                for (let i: number = 0; i < distribuicaoRepescada.length; i++) {

                    let trocou = false;

                    for (let j: number = 0; j < distribuicaoRepescada.length - 1; j++) {


                        const atual = distribuicaoRepescada[j];

                        const proximo = distribuicaoRepescada[j + 1];

                        const associacaoAtual = associacoes.find(a => a.cnpj === atual.cnpj)

                        const associacaoProxima = associacoes.find(a => a.cnpj === proximo.cnpj)

                        if (!associacaoAtual || !associacaoProxima) {
                            continue
                        }

                        const fracaoAtual = () => {
                            const loteTotalOriginal = Math.floor(totalMudas / MUDAS_POR_BANDEJA);
                            const cotaIdeal = loteTotalOriginal * associacaoAtual.familias / somaDasFamilias;
                            return cotaIdeal - Math.floor(cotaIdeal)
                        }

                        const fracaoProximo = () => {
                            const loteTotalOriginal = Math.floor(totalMudas / MUDAS_POR_BANDEJA);
                            const cotaIdeal = loteTotalOriginal * associacaoProxima.familias / somaDasFamilias;

                            return cotaIdeal - Math.floor(cotaIdeal)
                        }

                        if (fracaoProximo() > fracaoAtual()) {
                            trocou = true
                            const temporario = distribuicaoRepescada[j];
                            distribuicaoRepescada[j] = distribuicaoRepescada[j + 1];
                            distribuicaoRepescada[j + 1] = temporario;

                            continue
                        }

                        if (fracaoAtual() == fracaoProximo()) {

                            if (proximo.familias > atual.familias) {
                                trocou = true

                                const temporario = distribuicaoRepescada[j];
                                distribuicaoRepescada[j] = distribuicaoRepescada[j + 1];
                                distribuicaoRepescada[j + 1] = temporario;
                                continue
                            }

                            else if (proximo.familias == atual.familias) {
                                const nomeOrdenacao = proximo.nome.localeCompare(atual.nome, "pt-BR", { sensitivity: "base" })

                                if (nomeOrdenacao < 0) {
                                    trocou = true

                                    const temporario = distribuicaoRepescada[j];
                                    distribuicaoRepescada[j] = distribuicaoRepescada[j + 1];
                                    distribuicaoRepescada[j + 1] = temporario;
                                    continue
                                } else if (nomeOrdenacao === 0) {

                                    const cnpjOrdenacao = proximo.cnpj.localeCompare(atual.cnpj, "pt-BR", { sensitivity: "base" })

                                    if (cnpjOrdenacao < 0) {

                                        trocou = true

                                        const temporario = distribuicaoRepescada[j];
                                        distribuicaoRepescada[j] = distribuicaoRepescada[j + 1];
                                        distribuicaoRepescada[j + 1] = temporario;
                                        continue
                                    }

                                }

                            }

                        }

                    }

                    if (!trocou) {
                        break
                    }
                }

                if (loteDisponivel == 1) {
                    for (const associacao of primeiraDistribuicao) {
                        if (distribuicaoRepescada[0].cnpj === associacao.cnpj) {
                            associacao.bandejas += loteDisponivel
                            associacao.mudas += loteDisponivel * MUDAS_POR_BANDEJA
                            loteDisponivel -= 1
                            break
                        }
                    }
                    continue
                }

            }

            const distribuicao = distribuicaoRepescada.map(associacao => {

                const bandejasMaxima = associacao.cotaMaxima / MUDAS_POR_BANDEJA

                const cotaIdeal = loteDisponivel * associacao.familias / somaDasFamilias

                const bandejaEncontrada = Math.floor(cotaIdeal) > bandejasMaxima ? bandejasMaxima : Math.floor(cotaIdeal)

                const bandejaDisponível = loteDisponivel > bandejaEncontrada ? bandejaEncontrada : loteDisponivel



                if (associacao.situacao !== "regular") {

                    const distribuido: Distribuicao = {
                        nome: associacao.nome,
                        cnpj: associacao.cnpj,
                        bandejas: 0,
                        mudas: 0
                    }

                    return distribuido
                }

                if (bandejaDisponível == bandejasMaxima) {
                    retirarFamilias += associacao.familias
                    loteRetirar += bandejasMaxima
                } else {
               
                    loteRetirar += bandejaDisponível
                }
                const distribuicao: Distribuicao = {
                    nome: associacao.nome,
                    cnpj: associacao.cnpj,
                    bandejas: bandejaDisponível,
                    mudas: bandejaDisponível * MUDAS_POR_BANDEJA
                }

                return distribuicao
            })

            primeiraDistribuicao.forEach(associacao => {
                const associacaoEncontrada = distribuicao.find(a => a.cnpj === associacao.cnpj)
                if (associacaoEncontrada) {
                    associacao.bandejas = associacaoEncontrada.bandejas
                    associacao.mudas = associacaoEncontrada.mudas
                }

            })


            loteDisponivel -= loteRetirar
            somaDasFamilias -= retirarFamilias

            continue

        }
        break

    }

    const resultado: ResultadoRateio = {
        distribuicao: primeiraDistribuicao.sort((a, b) => {
            if (b.mudas !== a.mudas) {
                return b.mudas - a.mudas
            }

            return a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
        }),
        totalDistribuido: totalMudas - (loteDisponivel * MUDAS_POR_BANDEJA) - restos,
        sobraNaoDistribuida: restos + (loteDisponivel * MUDAS_POR_BANDEJA)
    }
    return resultado
}
