import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
export async function action({ request }) {
  const {session, admin} = await authenticate.public.appProxy(request);
  if(session) {
    console.log('----------------------- REQUEST START -----------------------')
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
      console.log(productData.data.customer.metafield.value)
      console.log('----------------------- REQUEST END -----------------------')
      return json({ data: productData.data });
    }
  }
  return null
}

const GetCart = () => {
  return <>Get Cart</>;
};

export default GetCart;
