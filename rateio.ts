
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

interface DistribuicaoComPontuacao extends Distribuicao {
    pontuacao: number;
    familias: number;
    bandejaLimite: number;
    situacao: SituacaoCadastral
}

export class RateioError extends Error {

}

export function ratearMudas(totalMudas: number, associados: Associacao[]): ResultadoRateio {

    //const associadosAprovados = associados.filter(associado => associado.situacao === "regular" && associado.familias > 0);

    let loteDisponivel = Math.floor(totalMudas / MUDAS_POR_BANDEJA);

    const sobraNaoDistribuida = (totalMudas - (loteDisponivel * MUDAS_POR_BANDEJA));

    const somaDasFamilias = associados.reduce((familiasSomada, familiasAtuais) => familiasSomada + familiasAtuais.familias, 0)

    const distribuicaoAssociados: DistribuicaoComPontuacao[] = associados.map(associacao => {

        if (associacao.situacao !== "regular") {

            const distribuicao: DistribuicaoComPontuacao = {
                nome: associacao.nome,
                cnpj: associacao.cnpj,
                bandejas: 0,
                mudas: 0,
                pontuacao: 0,
                familias: associacao.familias,
                bandejaLimite: 0,
                situacao: associacao.situacao,
                motivoExclusao: associacao.situacao
            }
            return distribuicao
        }

        const cotaIdeal = Math.floor(totalMudas / MUDAS_POR_BANDEJA) * associacao.familias / somaDasFamilias

        const bandejaLimite = cotaIdeal > 0 ? Math.floor(associacao.cotaMaxima / MUDAS_POR_BANDEJA) : cotaIdeal

        const bandejaEncontrada = Math.floor(cotaIdeal) > bandejaLimite ? bandejaLimite : Math.floor(cotaIdeal)

        const bandejaDisponivel = loteDisponivel > bandejaEncontrada ? bandejaEncontrada : loteDisponivel;


        loteDisponivel = loteDisponivel > bandejaEncontrada ? loteDisponivel - bandejaEncontrada : 0

        console.log(bandejaLimite)

        const distribuicao: DistribuicaoComPontuacao = {
            cnpj: associacao.cnpj,
            nome: associacao.nome,
            bandejas: bandejaDisponivel,
            mudas: bandejaDisponivel * MUDAS_POR_BANDEJA,
            pontuacao: cotaIdeal,
            familias: associacao.familias,
            bandejaLimite: bandejaLimite,
            situacao: "regular"
        }
        return distribuicao
    });


    if (loteDisponivel > 0 && distribuicaoAssociados.length > 0) {

        const associadosSemBandeja: DistribuicaoComPontuacao[] = distribuicaoAssociados.filter(associacao => associacao.bandejas < associacao.bandejaLimite && associacao.situacao === "regular")


        if (associadosSemBandeja.length > 0) {

            for (let i: number = 0; i < associadosSemBandeja.length; i++) {

                let trocou = false;

                for (let j: number = 0; j < associadosSemBandeja.length - 1; j++) {

                    const atual = associadosSemBandeja[j];

                    const proximo = associadosSemBandeja[j + 1];

                    const fracaoAtual = atual.pontuacao - Math.floor(atual.pontuacao);
                    const fracaoProximo = proximo.pontuacao - Math.floor(proximo.pontuacao);

                    if (fracaoProximo > fracaoAtual) {
                        trocou = true
                        const temporario = associadosSemBandeja[j];
                        associadosSemBandeja[j] = associadosSemBandeja[j + 1];
                        associadosSemBandeja[j + 1] = temporario;

                        continue
                    }

                    if (fracaoAtual == fracaoProximo) {

                        if (proximo.familias < atual.familias) {
                            trocou = true

                            const temporario = associadosSemBandeja[j];
                            associadosSemBandeja[j] = associadosSemBandeja[j + 1];
                            associadosSemBandeja[j + 1] = temporario;
                            continue
                        }

                        else if (proximo.familias == atual.familias) {
                            const nomeOrdenacao = proximo.nome.localeCompare(atual.nome, "pt-BR", { sensitivity: "base" })

                            if (nomeOrdenacao < 0) {
                                trocou = true

                                const temporario = associadosSemBandeja[j];
                                associadosSemBandeja[j] = associadosSemBandeja[j + 1];
                                associadosSemBandeja[j + 1] = temporario;
                                continue
                            } else if (nomeOrdenacao === 0) {

                                const cnpjOrdenacao = proximo.cnpj.localeCompare(atual.cnpj, "pt-BR", { sensitivity: "base" })

                                if (cnpjOrdenacao < 0) {

                                    trocou = true

                                    const temporario = associadosSemBandeja[j];
                                    associadosSemBandeja[j] = associadosSemBandeja[j + 1];
                                    associadosSemBandeja[j + 1] = temporario;
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

            let index = 0;

            let bandejaAdicionada = false
            while (loteDisponivel > 0) {

                if (associadosSemBandeja.length == index) {
                    if (!bandejaAdicionada) {
                        break
                    }
                    index = 0
                    bandejaAdicionada = false
                }

                if (associadosSemBandeja[index].bandejas < associadosSemBandeja[index].bandejaLimite) {
                    associadosSemBandeja[index].bandejas += 1
                    associadosSemBandeja[index].mudas += MUDAS_POR_BANDEJA
                    loteDisponivel -= 1
                    bandejaAdicionada = true
                }
                index++

            }

        }



    }

    const associadosDistribuidos: Distribuicao[] = distribuicaoAssociados.map(associado => {
        const distribuido: Distribuicao = {
            cnpj: associado.cnpj,
            nome: associado.nome,
            bandejas: associado.bandejas,
            mudas: associado.mudas,
            ...(associado.motivoExclusao && {
                motivoExclusao: associado.motivoExclusao
            })
        }

        return distribuido
    })

    for (let i: number = 0; i < associadosDistribuidos.length; i++) {
        for (let j: number = 0; j < associadosDistribuidos.length - 1; j++) {
            const atual = associadosDistribuidos[j]
            const proximo = associadosDistribuidos[j + 1]

            if (proximo.mudas > atual.mudas) {
                const temporario = atual
                associadosDistribuidos[j] = proximo
                associadosDistribuidos[j + 1] = temporario
            } else if (proximo.mudas == atual.mudas) {

                const resultado = proximo.nome.localeCompare(atual.nome, "pt-BR", { sensitivity: "base" })

                if (resultado < 0) {
                    const temporario = atual
                    associadosDistribuidos[j] = proximo
                    associadosDistribuidos[j + 1] = temporario
                }
            }
        }
    }

    const resultadoDistribuicao: ResultadoRateio = {
        distribuicao: associadosDistribuidos,
        totalDistribuido: totalMudas - (loteDisponivel * MUDAS_POR_BANDEJA) - sobraNaoDistribuida,
        sobraNaoDistribuida: sobraNaoDistribuida + (loteDisponivel * MUDAS_POR_BANDEJA)
    }
    return resultadoDistribuicao
}
