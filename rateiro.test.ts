import { describe, expect, it } from "vitest";
import type { Associacao, Distribuicao, ResultadoRateio } from "./rateio";
import { ratearMudas } from "./rateio";
describe("Distribui corretamente os lotes entre as associações", () => {

    it("Exemplo 1 - Saturação e redistribuição", () => {
        const totalMudas = 18_000

        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "APROPERO",
                municipio: "Chupinguaia",
                familias: 80,
                cotaMaxima: 18_000,
                cnpj: "15.893.829/0001-38",
                situacao: "regular"
            },
            {
                nome: "ARUVE",
                municipio: "Cacoal",
                familias: 80,
                cotaMaxima: 18_000,
                cnpj: "22.859.854/0001-60",
                situacao: "regular"

            },
            {
                nome: "Água Boa",
                municipio: "Água Boa",
                familias: 45,
                cotaMaxima: 2_000,
                cnpj: "34.537.183/0001-09",
                situacao: "regular"
            },
            {
                nome: "ACRUB",
                municipio: "Cacoal",
                familias: 35,
                cotaMaxima: 18_000,
                cnpj: "82.589.865/0001-08",
                situacao: "suspensa"
            },
            {
                nome: "Alto Alegre",
                municipio: "Vale do Anari",
                familias: 0,
                cotaMaxima: 5_000,
                cnpj: "02.785.883/0001-18",
                situacao: "regular"
            }
        ]

        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1].nome,
                cnpj: associacoes[1].cnpj,
                bandejas: 120,
                mudas: 6_000
            },
            {
                nome: associacoes[2].nome,
                cnpj: associacoes[2].cnpj,
                bandejas: 120,
                mudas: 6_000
            },
            {
                nome: associacoes[0].nome,
                cnpj: associacoes[0].cnpj,
                bandejas: 80,
                mudas: 4_000
            },
            {
                nome: associacoes[3].nome,
                cnpj: associacoes[3].cnpj,
                bandejas: 40,
                mudas: 2_000
            },
            {
                nome: associacoes[4].nome,
                cnpj: associacoes[4].cnpj,
                bandejas: 0,
                mudas: 0,
                motivoExclusao: associacoes[4].situacao
            },
            {
                nome: associacoes[5].nome,
                cnpj: associacoes[5].cnpj,
                bandejas: 0,
                mudas: 0
            }
        ]

        const resultadoEsperado: ResultadoRateio = {
            distribuicao: distribuicaoEsperada,
            totalDistribuido: 18_000,
            sobraNaoDistribuida: 0
        }
        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado)

    })
    
    

    it("Maiores restos, sobra e ordenação", () => {
        const totalMudas = 5_180
        const associacoes: Associacao[] = [
            {
                nome: "Alto Alegre",
                municipio: "Vale do Anari",
                cnpj: "02.785.883/0001-18",
                familias: 10,
                cotaMaxima: 100_000,
                situacao: "regular"
            },
            {
                nome: "Água Boa",
                municipio: "Água Boa",
                familias: 10,
                cotaMaxima: 100_000,
                cnpj: "34.537.183/0001-09",
                situacao: "regular"
            },
            {
                nome: "Boa Esperança",
                municipio: "Novo Mundo",
                familias: 5,
                cotaMaxima: 3_000,
                cnpj: "25.027.055/0001-16",
                situacao: "regular"
            }
        ]

        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1].nome,
                cnpj: associacoes[1].cnpj,
                bandejas: 41,
                mudas: 2_050
            },
            {
                nome: associacoes[0].nome,
                cnpj: associacoes[0].cnpj,
                bandejas: 41,
                mudas: 2_050
            },
            {
                nome: associacoes[2].nome,
                cnpj: associacoes[2].cnpj,
                bandejas: 21,
                mudas: 1_050
            }
        ]
        const resultadoEsperado: ResultadoRateio = {
            distribuicao: distribuicaoEsperada,
            totalDistribuido: 5150,
            sobraNaoDistribuida: 30
        }

        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado)
    })

    it("Destribui corretamente baseado no cnpj", () => {
        const totalMudas = 150;

        const associacoes: Associacao[] = [
            {
                nome: "Associação dos Produtores",
                municipio: "Ouro Preto",
                familias: 10,
                cotaMaxima: 1000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            },
            {

                nome: "Associação dos Produtores",
                municipio: "Ji-Paraná",
                familias: 10,
                cotaMaxima: 1000,
                cnpj: "11.111.111/0001-11",
                situacao: "regular"
            }
        ];


        const distribuicaoEsperada: Distribuicao[] = [
            {
                nome: associacoes[1].nome,
                cnpj: associacoes[1].cnpj,
                bandejas: 2,
                mudas: 100
            },
            {
                nome: associacoes[0].nome,
                cnpj: associacoes[0].cnpj,
                bandejas: 1,
                mudas: 50
            }
        ];

        const resultadoEsperado: ResultadoRateio = {
            distribuicao: distribuicaoEsperada,
            totalDistribuido: 150,
            sobraNaoDistribuida: 0
        };

        expect(ratearMudas(totalMudas, associacoes)).toEqual(resultadoEsperado);
    });
})

describe("Erro ao realizar rateio", () => {

    it("CNPJs duplicados", () => {
        const totalMudas = 18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            }]


        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`CNPJs duplicados: ${JSON.stringify(associacoes.map(a => a.cnpj))}`)
    })

    it("deve retornar erro com totalMudas possuindo valor negativo ou zero", () => {
        const totalMudas = -18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`totalMudas não pode receber valores negativos ou zero.`)
    })

    it("deve retornar erro com cotaMaxima possuindo valor negativo", () => {
        const totalMudas = 18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: -4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`Associação ${associacoes[0].nome} de CNPJ ${associacoes[0].cnpj} possui uma cota máxima negativa de ${associacoes[0].cotaMaxima}`)
    })

    it("deve retornar erro com associações famílias com valor negativo", () => {
        const totalMudas = 18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: -120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`Associação ${associacoes[0].nome} de CNPJ ${associacoes[0].cnpj} possui um número de famílias negativo de ${associacoes[0].familias}`)
    })
    it("deve retornar erro com associações que tiverem a cotaMaxima em ponto flutuante ao invés de inteiros positivos", () => {
        const totalMudas = 18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000.01,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`Associação ${associacoes[0].nome} de CNPJ ${associacoes[0].cnpj} não deve ter o valor da cota máxima como um número flutuante, valor encontrado de cotaMaxima é ${associacoes[0].cotaMaxima}`)
    })

    it("deve retornar erro com associações que tiverem a familias em ponto flutuante ao invés de inteiros positivos", () => {
        const totalMudas = 18_000
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120.12,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`Associação ${associacoes[0].nome} de CNPJ ${associacoes[0].cnpj} não deve ter o valor das famílias como um número flutuante, valor encontrado de familias é ${associacoes[0].familias}`)
    })

    it("deve retornar erro com valor de totalMudas sendo um número flutuante e não inteiro positivo", () => {
        const totalMudas = 18_000.12
        const associacoes: Associacao[] = [
            {
                nome: "ASPRORIO",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "07.308.498/0001-01",
                situacao: "regular"
            },
            {
                nome: "ASPRORIO_2",
                municipio: "Espigao D Oeste",
                familias: 120,
                cotaMaxima: 4_000,
                cnpj: "22.222.222/0001-22",
                situacao: "regular"
            }]

        expect(() => ratearMudas(totalMudas, associacoes)).toThrow(`O campo totalMudas não pode ser um número flutuante, deve ser um inteiro positivo. O valor atual é ${totalMudas}`)
    })
})