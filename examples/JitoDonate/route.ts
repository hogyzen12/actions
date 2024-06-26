// JitoDonate/route.ts

import {
LAMPORTS_PER_SOL,
PublicKey,
} from '@solana/web3.js';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
actionSpecOpenApiPostRequestBody,
actionsSpecOpenApiGetResponse,
actionsSpecOpenApiPostResponse,
} from '../openapi';
import {
ActionsSpecGetResponse,
ActionsSpecPostRequestBody,
ActionsSpecPostResponse,
} from '../../spec/actions-spec';
import { prepareJitoDonateTransaction } from '../enhanced-transaction-utils';

const DONATION_DESTINATION_WALLET =
'unrgaQNp1T3SqEFvykVBc3L2Fb2CVJG46nKTx2mXPsx';
const DONATION_AMOUNT_SOL_OPTIONS = [0.01, 0.1, 0.42];
const DEFAULT_DONATION_AMOUNT_SOL = 0.1;

const app = new OpenAPIHono();

app.openapi(
createRoute({
    method: 'get',
    path: '/',
    tags: ['JitoDonate'],
    responses: actionsSpecOpenApiGetResponse,
}),
(c) => {
    const response = createDonateResponse();
    return c.json(response, 200);
},
);

app.openapi(
createRoute({
    method: 'get',
    path: '/{amount}',
    tags: ['JitoDonate'],
    request: {
    params: z.object({
        amount: z.string().openapi({
        param: {
            name: 'amount',
            in: 'path',
        },
        type: 'number',
        example: '1',
        }),
    }),
    },
    responses: actionsSpecOpenApiGetResponse,
}),
(c) => {
    const amount = c.req.param('amount');
    const response = createDonateAmountResponse(amount);
    return c.json(response, 200);
},
);

app.openapi(
createRoute({
    method: 'post',
    path: '/{amount}',
    tags: ['JitoDonate'],
    request: {
    params: z.object({
        amount: z
        .string()
        .optional()
        .openapi({
            param: {
            name: 'amount',
            in: 'path',
            required: false,
            },
            type: 'number',
            example: '1',
        }),
    }),
    body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
}),
async (c) => {
    const amount =
    c.req.param('amount') ?? DEFAULT_DONATION_AMOUNT_SOL.toString();
    const { account } = (await c.req.json()) as ActionsSpecPostRequestBody;

    const parsedAmount = parseFloat(amount);
    const transaction = await prepareJitoDonateTransaction(
    new PublicKey(account),
    new PublicKey(DONATION_DESTINATION_WALLET),
    parsedAmount * LAMPORTS_PER_SOL,
    );
    const response: ActionsSpecPostResponse = {
    transaction: Buffer.from(transaction.serialize()).toString('base64'),
    };
    return c.json(response, 200);
},
);

function getDonateInfo(): Pick<
  ActionsSpecGetResponse,
  'icon' | 'title' | 'description'
> {
  const icon =
    'https://shdw-drive.genesysgo.net/3UgjUKQ1CAeaecg5CWk88q9jGHg8LJg9MAybp4pevtFz/animation.gif';
  const title = 'Implementing Jito so donations land!';
  const description =
    'Support open source goods like unruggable <3.';
  return { icon, title, description };
}

function createDonateResponse(): ActionsSpecGetResponse {
const { icon, title, description } = getDonateInfo();
const amountParameterName = 'amount';

return {
    icon,
    label: `${DEFAULT_DONATION_AMOUNT_SOL} SOL`,
    title,
    description,
    links: {
    actions: [
        ...DONATION_AMOUNT_SOL_OPTIONS.map((amount) => ({
        label: `${amount} SOL`,
        href: `/api/jitodonate/${amount}`,
        })),
        {
        href: `/api/jitodonate/{${amountParameterName}}`,
        label: 'Jito Donate',
        parameters: [
            {
            name: amountParameterName,
            label: 'Enter a custom SOL amount',
            },
        ],
        },
    ],
    },
};
}

function createDonateAmountResponse(amount: string): ActionsSpecGetResponse {
const { icon, title, description } = getDonateInfo();
return {
    icon,
    label: `${amount} SOL`,
    title,
    description,
};
}

export default app;