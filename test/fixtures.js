function makeIdeasArray() {
  return [
    {
      id: 1,
      project_title: "First Project",
      project_summary:
        "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
      date_submitted: "2019-12-21T07:00:00.000Z",
      status: "Idea",
      github: "fake_url",
      votes: "5",
      author: 1
    },
    {
      id: 2,
      project_title: "Second Project",
      project_summary:
        "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
      date_submitted: "2019-12-21T07:00:00.000Z",
      status: "Idea",
      github: "fake_url",
      votes: "50",
      author: 2
    },
    {
      id: 3,
      project_title: "Third Project",
      project_summary:
        "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
      date_submitted: "2019-12-21T07:00:00.000Z",
      status: "Idea",
      github: "fake_url",
      votes: "25",
      author: 3
    },
    {
      id: 4,
      project_title: "Fourth Project",
      project_summary:
        "Lorem ipsum dolor sit amet, te autem soluta facilisi vel, feugiat perfecto sapientem sit ei, in sit electram abhorreant. Ne nam aeterno labitur admodum, qui timeam quaerendum ullamcorper ut. Porro debet molestie eu duo, sea no essent feugait. In nec atqui scaevola, ea sed everti sanctus convenire. Ea quod discere pri, hinc incorrupte ne his.",
      date_submitted: "2019-12-21T07:00:00.000Z",
      status: "Idea",
      github: "fake_url",
      votes: "25",
      author: 3
    }
  ];
}

function makeXssIdea() {
  return [
    {
      id: 1,
      project_title: '<script>alert("xss");</script>',
      project_summary:
        '<img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      date_submitted: "2020-01-30T07:00:00.000Z",
      status: "Idea",
      github: "",
      votes: 0,
      author: 2
    }
  ];
}

function makeXssUser() {
  return [
    {
      id: 1,
      first_name: '<script>alert("xss");</script>',
      last_name:
        '<img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.',
      email: '<script>alert("xss");</script>',
      password: '<script>alert("xss");</script>',
      nickname: '<script>alert("xss");</script>',
      date_created: "2020-01-30T07:00:00.000Z",
      votes: 0,
      date_created: "2020-01-30T07:00:00.000Z"
    }
  ];
}
function makeXssComment() {
  return [
    {
      id: 1,
      comment_text: '<script>alert("xss");</script>',
      votes: 0,
      date_submitted: "2020-01-30T07:00:00.000Z",
      author: 2,
      project: 1
    }
  ];
}

function makeCommentsArray() {
  return [
    {
      id: 1,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      votes: "15",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author: 2,
      project: 1
    },
    {
      id: 2,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      votes: "9",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author: 3,
      project: 1
    },
    {
      id: 3,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      votes: "25",
      date_submitted: "2020-01-30T07:00:00.000Z",
      author: 4,
      project: 1
    },
    {
      id: 4,
      author: 1,
      project: 2,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      votes: "0"
    },
    {
      id: 5,
      author: 3,
      project: 2,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      votes: "7"
    },
    {
      id: 6,
      author: 4,
      project: 2,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      votes: "10"
    },
    {
      id: 7,
      author: 1,
      project: 3,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      votes: "3"
    },
    {
      id: 8,
      author: 2,
      project: 3,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-12-21T07:00:00.000Z",
      votes: "6"
    },
    {
      id: 9,
      author: 4,
      project: 3,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-12-21T07:00:00.000Z",
      votes: "12"
    },
    {
      id: 10,
      author: 1,
      project: 4,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-12-21T07:00:00.000Z",
      votes: "1"
    },
    {
      id: 11,
      author: 2,
      project: 4,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-12-21T07:00:00.000Z",
      votes: "16"
    },
    {
      id: 12,
      author: 3,
      project: 4,
      comment_text:
        "Ne velit facilis deserunt nam, eum lucilius constituto ex. Odio rebum dignissim ad mel, an ius tollit veniam, vix vidit mazim homero ad. Paulo definitiones et mei, nam ne illum scripta. Zril senserit at has, at est clita eirmod moderatius. Et mnesarchum posidonium sea, aliquid debitis oportere qui et. Vix no ullum adipiscing, an qui nulla temporibus.",
      date_submitted: "2020-01-30T07:00:00.000Z",
      votes: "3"
    }
  ];
}

function makeUsersArray() {
  return [
    {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "jdoe@devevlopmenttesting.com",
      password: "notRealForDev!1",
      nickname: "code_guru",
      votes: "77",
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 2,
      first_name: "Luke",
      last_name: "Doe",
      email: "ldoe@devevlopmenttesting.com",
      password: "notRealForDev1!",
      nickname: "react_champ",
      votes: "35",
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 3,
      first_name: "Bob",
      last_name: "Doe",
      email: "bdoe@devevlopmenttesting.com",
      password: "notRealForDev1!",
      nickname: "jquery_king",
      votes: "20",
      date_created: "2020-12-21T07:00:00.000Z"
    },
    {
      id: 4,
      first_name: "Steve",
      last_name: "Doe",
      email: "sdoe@devevlopmenttesting.com",
      password: "notRealForDev1!",
      nickname: "css_aficianado",
      votes: "15",
      date_created: "2020-12-21T07:00:00.000Z"
    }
  ];
}

module.exports = {
  makeIdeasArray,
  makeXssIdea,
  makeCommentsArray,
  makeUsersArray,
  makeXssUser,
  makeXssComment
};
