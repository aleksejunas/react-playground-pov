import { Button, HStack } from "@chakra-ui/react";
import { RiArrowRightLine, RiMailLine } from "react-icons/ri";

const Demo = () => {
  return (
    <>
      <HStack style={{ margin: "2rem", padding: "1rem" }}>
        <Button size="xl" variant="solid">
          Solid
        </Button>
        <Button size="xl" variant="ghost">
          Ghost
        </Button>
        <Button size="xl" variant="subtle">
          Subtle
        </Button>
        <Button size="xl" variant="surface">
          Surface
        </Button>
        <Button size="xl" variant="outline">
          Outline
        </Button>
        <Button size="xl" variant="plain">
          Plain
        </Button>
      </HStack>
      <HStack style={{ marginLeft: "2rem" }}>
        <Button colorPalette="teal" variant="solid">
          <RiMailLine /> Email
        </Button>
        <Button colorPalette="yellow" variant="outline">
          Call us <RiArrowRightLine />
        </Button>
      </HStack>
    </>
  );
};

export default Demo;
