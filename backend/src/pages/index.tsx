// pages/index.tsx
import Head from "next/head";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="container">
      <Head>
        <title>Hello World Next.js</title>
        <meta name="description" content="My first Next.js app with TypeScript" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">Hello World</h1>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans,
            Droid Sans, Helvetica Neue, sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
};

export default Home;
