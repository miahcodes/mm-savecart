import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const {session, admin} = await authenticate.public.appProxy(request);
  if(session) {
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    const customer_id = `gid://shopify/Customer/${params.get('logged_in_customer_id')}`;

    if (customer_id.length > 1) {
      const response = await admin.graphql(
        `#graphql
          query getCart($customer_id: ID!) {
            customer(id: $customer_id) {
              metafield(key: "token", namespace: "cart") {
                value
              }
            }
          }`,
        {
          variables: {
            customer_id: customer_id
          }
        }
      );
      const productData = await response.json();
      return json({ cart_token: productData.data.customer.metafield.value });
    }
  }
  return null
}

export async function action({ request }) {
  const {session, admin} = await authenticate.public.appProxy(request);
  if(session) {
    const reqbody = await request.json();
    const url = new URL(request.url);
    const params = new URLSearchParams(url.search);
    const customer_id = `gid://shopify/Customer/${params.get('logged_in_customer_id')}`;

    if (customer_id.length > 1) {
      // SAVE CART TOKEN INTO CUSTOMER METAFIELD
      if(reqbody.type == 'save' && reqbody.cart_token.length > 1){
        const response = await admin.graphql(
          `#graphql
              mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
                  metafieldsSet(metafields: $metafields) {
                  metafields {
                      key
                      namespace
                      value
                      createdAt
                      updatedAt
                  }
                  userErrors {
                      field
                      message
                      code
                  }
                  }
              }`,
          {
            variables: {
              metafields: [
                {
                  key: "token",
                  namespace: "cart",
                  ownerId: `${customer_id}`,
                  value: `${reqbody.cart_token}`,
                  type: "single_line_text_field",
                },
              ],
            },
          },
        );
        const cust_data = await response.json();
        return json({ data: cust_data.data });
      }
    }
  }
  return null
}
