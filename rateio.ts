
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
    distribuicoes: Distribuicao[];
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

    let somaDasFamilias = associacoes.reduce((valorassociacaoAtual , associacao) => {
        if (associacao.situacao === "regular") {
            return valorassociacaoAtual  + associacao.familias
        }
        return valorassociacaoAtual 
    }, 0)

    let restos = totalMudas % MUDAS_POR_BANDEJA

    let loteDisponivel = Math.floor(totalMudas / MUDAS_POR_BANDEJA)

    let bandejasDistribuidasNestaRodada = 0;

    let familiasSaturadas = 0;

    const resultadoAcumulado: Distribuicao[] = associacoes.map(associacao => {
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

        const bandejasMaxima = associacao.cotaMaxima / MUDAS_POR_BANDEJA

        const cotaIdeal = loteDisponivel * associacao.familias / somaDasFamilias

        const bandejasCalculadas  = Math.floor(cotaIdeal) > bandejasMaxima ? bandejasMaxima : Math.floor(cotaIdeal)

        const bandejaDisponível = loteDisponivel > bandejasCalculadas  ? bandejasCalculadas  : loteDisponivel

        if (bandejaDisponível == bandejasMaxima) {
            familiasSaturadas += associacao.familias
            bandejasDistribuidasNestaRodada += bandejasMaxima
        } else {
            bandejasDistribuidasNestaRodada += bandejaDisponível
        }

        const distribuicao: Distribuicao = {
            nome: associacao.nome,
            cnpj: associacao.cnpj,
            bandejas: bandejaDisponível,
            mudas: bandejaDisponível * MUDAS_POR_BANDEJA
        }

        return distribuicao
    })

    loteDisponivel -= bandejasDistribuidasNestaRodada
    somaDasFamilias -= familiasSaturadas

    while (loteDisponivel > 0) {

        bandejasDistribuidasNestaRodada = 0
        familiasSaturadas = 0
        const associacoesRestantes= associacoes.filter(a => resultadoAcumulado.some(dis => dis.cnpj === a.cnpj && a.cotaMaxima / MUDAS_POR_BANDEJA > dis.bandejas))

        if (associacoesRestantes.length > 0) {

            if (associacoesRestantes.length > 1) {

                for (let i: number = 0; i < associacoesRestantes.length; i++) {

                    let trocou = false;

                    for (let j: number = 0; j < associacoesRestantes.length - 1; j++) {


                        const associacaoAtual  = associacoesRestantes[j];

                        const associacaoSeguinte = associacoesRestantes[j + 1];

                        const associacaoassociacaoAtual  = associacoes.find(a => a.cnpj === associacaoAtual .cnpj)

                        const associacaoProxima = associacoes.find(a => a.cnpj === associacaoSeguinte.cnpj)

                        if (!associacaoassociacaoAtual  || !associacaoProxima) {
                            continue
                        }

                        const fracaoassociacaoAtual  = () => {
                            const loteTotalOriginal = Math.floor(totalMudas / MUDAS_POR_BANDEJA);
                            const cotaIdeal = loteTotalOriginal * associacaoassociacaoAtual .familias / somaDasFamilias;
                            return cotaIdeal - Math.floor(cotaIdeal)
                        }

                        const fracaoassociacaoSeguinte = () => {
                            const loteTotalOriginal = Math.floor(totalMudas / MUDAS_POR_BANDEJA);
                            const cotaIdeal = loteTotalOriginal * associacaoProxima.familias / somaDasFamilias;

                            return cotaIdeal - Math.floor(cotaIdeal)
                        }

                        if (fracaoassociacaoSeguinte() > fracaoassociacaoAtual ()) {
                            trocou = true
                            const temporario = associacoesRestantes[j];
                            associacoesRestantes[j] = associacoesRestantes[j + 1];
                            associacoesRestantes[j + 1] = temporario;

                            continue
                        }

                        if (fracaoassociacaoAtual () == fracaoassociacaoSeguinte()) {

                            if (associacaoSeguinte.familias > associacaoAtual .familias) {
                                trocou = true

                                const temporario = associacoesRestantes[j];
                                associacoesRestantes[j] = associacoesRestantes[j + 1];
                                associacoesRestantes[j + 1] = temporario;
                                continue
                            }

                            else if (associacaoSeguinte.familias == associacaoAtual .familias) {
                                const nomeOrdenacao = associacaoSeguinte.nome.localeCompare(associacaoAtual .nome, "pt-BR", { sensitivity: "base" })

                                if (nomeOrdenacao < 0) {
                                    trocou = true

                                    const temporario = associacoesRestantes[j];
                                    associacoesRestantes[j] = associacoesRestantes[j + 1];
                                    associacoesRestantes[j + 1] = temporario;
                                    continue
                                } else if (nomeOrdenacao === 0) {

                                    const cnpjOrdenacao = associacaoSeguinte.cnpj.localeCompare(associacaoAtual .cnpj, "pt-BR", { sensitivity: "base" })

                                    if (cnpjOrdenacao < 0) {

                                        trocou = true

                                        const temporario = associacoesRestantes[j];
                                        associacoesRestantes[j] = associacoesRestantes[j + 1];
                                        associacoesRestantes[j + 1] = temporario;
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
                    for (const associacao of resultadoAcumulado) {
                        if (associacoesRestantes[0].cnpj === associacao.cnpj) {
                            associacao.bandejas += loteDisponivel
                            associacao.mudas += loteDisponivel * MUDAS_POR_BANDEJA
                            loteDisponivel -= 1
                            break
                        }
                    }
                    continue
                }

            }

            const distribuicao = associacoesRestantes.map(associacao => {

                const bandejasMaxima = associacao.cotaMaxima / MUDAS_POR_BANDEJA

                const cotaIdeal = loteDisponivel * associacao.familias / somaDasFamilias

                const bandejasCalculadas  = Math.floor(cotaIdeal) > bandejasMaxima ? bandejasMaxima : Math.floor(cotaIdeal)

                const bandejaDisponível = loteDisponivel > bandejasCalculadas  ? bandejasCalculadas  : loteDisponivel



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
                    familiasSaturadas += associacao.familias
                    bandejasDistribuidasNestaRodada += bandejasMaxima
                } else {
               
                    bandejasDistribuidasNestaRodada += bandejaDisponível
                }
                const distribuicao: Distribuicao = {
                    nome: associacao.nome,
                    cnpj: associacao.cnpj,
                    bandejas: bandejaDisponível,
                    mudas: bandejaDisponível * MUDAS_POR_BANDEJA
                }

                return distribuicao
            })

            resultadoAcumulado.forEach(associacao => {
                const associacaoEncontrada = distribuicao.find(a => a.cnpj === associacao.cnpj)
                if (associacaoEncontrada) {
                    associacao.bandejas += associacaoEncontrada.bandejas
                    associacao.mudas += associacaoEncontrada.mudas
                }

            })

            if (bandejasDistribuidasNestaRodada === 0) {
                for (let i = 0; i < loteDisponivel && i < associacoesRestantes.length; i++) {
                    const assoc = resultadoAcumulado.find(a => a.cnpj === associacoesRestantes[i].cnpj);
                    if (assoc) {
                        assoc.bandejas += 1;
                        assoc.mudas += MUDAS_POR_BANDEJA;
                    }
                }
                bandejasDistribuidasNestaRodada = loteDisponivel; 
            }

            loteDisponivel -= bandejasDistribuidasNestaRodada
            somaDasFamilias -= familiasSaturadas

            continue

        }
        break

    }

    const resultado: ResultadoRateio = {
        distribuicoes: resultadoAcumulado.sort((a, b) => {
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
