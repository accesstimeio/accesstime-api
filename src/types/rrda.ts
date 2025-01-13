type RRDA_RESULT_QUESTION = {
    name: string;
    type: string;
    class: string;
};

type RRDA_RESULT_ANSWER = {
    name: string;
    type: string;
    class: string;
    ttl?: number;
    rdlength?: number;
    rdata?: string;
};

export type RRDA_RESULT = {
    question: RRDA_RESULT_QUESTION[];
    answer: RRDA_RESULT_ANSWER[];
};
