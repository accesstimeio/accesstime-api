import { gql } from "graphql-request";

export const PROJECT_BY_ID_QUERY = gql`
    query ProjectById($id: String!) {
        accessTimes(where: { accessTimeId: $id }) {
            id
            extraTimes
            nextOwner
            owner
            packages
            paused
            paymentMethods
            prevOwner
        }
    }
`;
