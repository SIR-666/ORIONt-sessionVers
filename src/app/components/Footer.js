export default function Footer(props) {
  return (
    <>
      <footer
        className={
          (props.absolute
            ? "absolute w-full bottom-0 bg-gray-300"
            : "relative") + " pb-6"
        }
      >
        <div className="container mx-auto px-4">
          <hr className="mb-6 border-b-1 border-gray-300" />
          <div className="flex flex-wrap items-center md:justify-between justify-center">
            <div className="w-full md:w-4/12 px-4">
              <div className="text-sm text-gray-500 font-semibold py-1">
                Copyright © {new Date().getFullYear()}{" "}
                <a
                  href="https://greenfieldsdairy.com/"
                  className="text-gray-500 hover:text-gray-400 text-sm font-semibold py-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PT. Greenfields Indonesia
                </a>
              </div>
            </div>
            <div className="w-full md:w-8/12 px-4"></div>
          </div>
        </div>
      </footer>
    </>
  );
}
