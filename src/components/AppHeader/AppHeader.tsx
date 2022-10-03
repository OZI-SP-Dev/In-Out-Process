import { Avatar, Text, Tooltip, makeStyles } from "@fluentui/react-components";
import { useContext, FunctionComponent } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "providers/UserProvider";
import { tokens } from "@fluentui/react-theme";

/* FluentUI Styling */
const useStyles = makeStyles({
  navHeader: {
    display: "flex",
    position: "fixed",
    zIndex: 1000,
    width: "100%",
    height: "3em",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor:
      process.env.REACT_APP_TEST_SYS === "true"
        ? tokens.colorPaletteDarkOrangeBackground3
        : tokens.colorBrandBackground,
  },
  navHeaderPadding: {
    height: "3em",
  },
  navHeaderSiteName: {
    fontWeight: "bold",
    fontSize: "1.5em",
  },
  navLink: {
    marginLeft: "1em",
    marginRight: "1em",
    textDecorationLine: "none",
    ":hover": { textDecorationLine: "underline" },
    color: tokens.colorBrandBackgroundInverted,
  },
  navAvatar: { marginLeft: "auto", marginRight: "5px" }, // Force the Avatar icon to be positioned at the right most side
});

export const AppHeader: FunctionComponent<any> = (props) => {
  const classes = useStyles();

  const userContext = useContext(UserContext);

  const title =
    process.env.REACT_APP_TEST_SYS === "true" ||
    process.env.NODE_ENV === "development"
      ? "In-Out-Process TEST"
      : "In-Out-Process";

  return (
    <>
      <div role="heading" aria-level={1} className={classes.navHeader}>
        <Link className={classes.navLink} to="/">
          <Text className={classes.navHeaderSiteName}>{title}</Text>
        </Link>
        <Link to="/new" className={classes.navLink}>
          New In Processing
        </Link>
        <Tooltip
          relationship="description"
          content={userContext.user ? userContext.user?.Title : ""}
        >
          <Avatar
            className={classes.navAvatar}
            image={{ src: userContext.user?.imageUrl }}
            name={userContext.user?.Title}
            size={32}
          />
        </Tooltip>
      </div>
      {/* The below div is set to the same height of the above div,
            to ensure all conent loaded has proper padding at the top so that it isn't below the header */}
      <div className={classes.navHeaderPadding}></div>
    </>
  );
};
