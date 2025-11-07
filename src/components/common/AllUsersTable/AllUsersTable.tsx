import React from "react";
import styles from "./AllUsersTable.module.scss";
const AllUsersTable = () => {
 const groups = [
   { name: "All users", count: 7 },
   { name: "Group 1", role: "Preparer", count: 2 },
   { name: "Group 2", role: "Reviewer", count: 2 },
   { name: "Group 3", role: "Admin", count: 2 },
   { name: "Group 4", role: "Director", count: 1 },
 ];
 return (
<div className={styles.wrapper}>

<div className={styles.table}>
       {groups.map((g, i) => (
<div key={i} className={styles.row}>
<div className={styles.groupInfo}>
<div className={styles.groupName}>{g.name}</div>
             {g.role && <div className={styles.role}>{g.role}</div>}
</div>
<div className={styles.count}>{g.count}</div>

</div>
       ))}
</div>
</div>
 );
};
export default AllUsersTable;